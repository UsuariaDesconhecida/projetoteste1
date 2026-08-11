import { eq, desc, sql, count, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, items, InsertItem, Item, requisitions, InsertRequisition, Requisition, stockMovements, InsertStockMovement, StockMovement } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { mode: 'default' });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? 'solicitante',
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    if (user.openId === ENV.ownerOpenId || user.email === 'almoxsuporte@forvia.com') {
      values.role = 'admin';
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: {
        name: values.name,
        email: values.email,
        role: values.role,
        lastSignedIn: values.lastSignedIn,
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(items).orderBy(items.name);
}

export async function createItem(data: InsertItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(items).values(data);
  return result.insertId;
}

export async function updateItemStock(id: number, quantityChange: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(items)
    .set({ stock: sql`stock + ${quantityChange}` })
    .where(eq(items.id, id));
}

export async function getRequisitions(userRole?: string, userName?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select({
    id: requisitions.id,
    requesterName: requisitions.requesterName,
    area: requisitions.area,
    itemId: requisitions.itemId,
    quantity: requisitions.quantity,
    justification: requisitions.justification,
    status: requisitions.status,
    adminObservation: requisitions.adminObservation,
    createdAt: requisitions.createdAt,
    updatedAt: requisitions.updatedAt,
    itemName: items.name,
    itemCode: items.code,
    itemUnit: items.unit,
  })
  .from(requisitions)
  .leftJoin(items, eq(requisitions.itemId, items.id))
  .$dynamic();

  const rows = await query.orderBy(desc(requisitions.createdAt));
  return rows;
}

export async function createRequisition(data: InsertRequisition) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(requisitions).values(data);
  return result.insertId;
}

export async function updateRequisitionStatus(id: number, status: 'aprovada' | 'recusada', adminObservation: string, adminName: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const reqs = await db.select().from(requisitions).where(eq(requisitions.id, id)).limit(1);
  if (reqs.length === 0) throw new Error("Requisição não encontrada");
  const req = reqs[0];

  if (req.status !== 'pendente') {
    throw new Error("Esta requisição já foi avaliada.");
  }

  // Se for aprovada, valida o estoque ANTES de atualizar o status
  if (status === 'aprovada') {
    const itms = await db.select().from(items).where(eq(items.id, req.itemId)).limit(1);
    if (itms.length === 0) throw new Error("Item associado não encontrado no catálogo.");
    const itm = itms[0];

    if (itm.stock < req.quantity) {
      throw new Error(`Estoque insuficiente (${itm.stock} disponíveis, solicitados ${req.quantity}). Não é possível aprovar.`);
    }

    // Decrementar estoque
    await updateItemStock(req.itemId, -req.quantity);

    // Registrar movimento de estoque
    await db.insert(stockMovements).values({
      itemId: req.itemId,
      type: 'saida',
      quantity: req.quantity,
      reason: `Requisição #${req.id} aprovada (Área: ${req.area})`,
      responsible: adminName,
      requisitionId: req.id,
    });
  }

  // Atualizar status
  await db.update(requisitions)
    .set({ status, adminObservation })
    .where(eq(requisitions.id, id));
}

export async function getStockMovements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: stockMovements.id,
    itemId: stockMovements.itemId,
    type: stockMovements.type,
    quantity: stockMovements.quantity,
    reason: stockMovements.reason,
    responsible: stockMovements.responsible,
    requisitionId: stockMovements.requisitionId,
    createdAt: stockMovements.createdAt,
    itemName: items.name,
    itemCode: items.code,
    itemUnit: items.unit,
  })
  .from(stockMovements)
  .leftJoin(items, eq(stockMovements.itemId, items.id))
  .orderBy(desc(stockMovements.createdAt));
}

export async function createStockMovement(data: InsertStockMovement) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const change = data.type === 'entrada' ? data.quantity : -data.quantity;
  await updateItemStock(data.itemId, change);

  const [result] = await db.insert(stockMovements).values(data);
  return result.insertId;
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { pendingReqs: 0, lowStockCount: 0, totalItems: 0, recentMovements: [], areaConsumption: [], itemConsumption: [] };

  const allReqs = await db.select().from(requisitions);
  const pendingReqs = allReqs.filter(r => r.status === 'pendente').length;

  const allItems = await db.select().from(items);
  const totalItems = allItems.length;
  const lowStockCount = allItems.filter(i => i.stock <= i.minStock).length;

  const movements = await getStockMovements();
  const recentMovements = movements.slice(0, 10);

  const approvedReqs = allReqs.filter(r => r.status === 'aprovada');
  
  // Consumo por área
  const areaMap: Record<string, number> = {};
  for (const r of approvedReqs) {
    areaMap[r.area] = (areaMap[r.area] || 0) + r.quantity;
  }
  const areaConsumption = Object.entries(areaMap).map(([area, total]) => ({ area, total }));

  // Consumo por item
  const itemMap: Record<number, { name: string; total: number }> = {};
  for (const r of approvedReqs) {
    const foundItem = allItems.find(i => i.id === r.itemId);
    const itemName = foundItem ? foundItem.name : `Item #${r.itemId}`;
    if (!itemMap[r.itemId]) {
      itemMap[r.itemId] = { name: itemName, total: 0 };
    }
    itemMap[r.itemId].total += r.quantity;
  }
  const itemConsumption = Object.values(itemMap).sort((a, b) => b.total - a.total).slice(0, 5);

  return {
    pendingReqs,
    lowStockCount,
    totalItems,
    recentMovements,
    areaConsumption,
    itemConsumption,
  };
}
