import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "solicitante"]).default("solicitante").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de Catálogo de Materiais e EPIs
export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  category: varchar("category", { length: 64 }).notNull(), // 'EPI' ou 'Material'
  unit: varchar("unit", { length: 32 }).notNull(), // 'un', 'cx', 'par', 'kg', etc.
  stock: int("stock").default(0).notNull(),
  minStock: int("minStock").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

// Tabela de Requisições
export const requisitions = mysqlTable("requisitions", {
  id: int("id").autoincrement().primaryKey(),
  requesterName: varchar("requesterName", { length: 128 }).notNull(),
  area: varchar("area", { length: 64 }).notNull(),
  itemId: int("itemId").notNull(),
  quantity: int("quantity").notNull(),
  justification: text("justification").notNull(),
  status: mysqlEnum("status", ["pendente", "aprovada", "recusada"]).default("pendente").notNull(),
  adminObservation: text("adminObservation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Requisition = typeof requisitions.$inferSelect;
export type InsertRequisition = typeof requisitions.$inferInsert;

// Tabela de Histórico de Movimentações de Estoque
export const stockMovements = mysqlTable("stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  type: mysqlEnum("type", ["entrada", "saida"]).notNull(),
  quantity: int("quantity").notNull(),
  reason: text("reason").notNull(),
  responsible: varchar("responsible", { length: 128 }).notNull(),
  requisitionId: int("requisitionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;
