import { getDb } from "./db";
import { items } from "../drizzle/schema";

export async function seedInitialItems() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(items);
  if (existing.length > 0) return; // Já populado

  const initialItems = [
    { code: "EPI-001", name: "Óculos de Proteção Incolor Anti-risco", category: "EPI", unit: "un", stock: 120, minStock: 20 },
    { code: "EPI-002", name: "Protetor Auricular Tipo Plug de Silicone", category: "EPI", unit: "par", stock: 250, minStock: 50 },
    { code: "EPI-003", name: "Luva de Raspa de Couro para Soldador", category: "EPI", unit: "par", stock: 45, minStock: 15 },
    { code: "EPI-004", name: "Botina de Segurança com Biqueira de Aço", category: "EPI", unit: "par", stock: 30, minStock: 10 },
    { code: "EPI-005", name: "Capacete de Segurança com Jugular", category: "EPI", unit: "EPI", stock: 60, minStock: 15 },
    { code: "MAT-101", name: "Fita Isola-Tudo Isolante 20m", category: "Material", unit: "un", stock: 85, minStock: 20 },
    { code: "MAT-102", name: "Disco de Corte Aço Inox 4.1/2\"", category: "Material", unit: "un", stock: 15, minStock: 25 }, // Estoque baixo
    { code: "MAT-103", name: "Spray Lubrificante Antiferrugem 300ml", category: "Material", unit: "un", stock: 8, minStock: 10 }, // Estoque baixo
    { code: "MAT-104", name: "Broca de Aço Rápido 6mm", category: "Material", unit: "un", stock: 40, minStock: 10 },
    { code: "MAT-105", name: "Braçadeira de Nylon (Enforca-gato) 100un", category: "Material", unit: "pct", stock: 50, minStock: 10 },
  ];

  for (const item of initialItems) {
    try {
      await db.insert(items).values(item);
    } catch (e) {
      // Ignorar duplicados
    }
  }
}
