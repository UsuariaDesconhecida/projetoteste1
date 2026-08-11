export type NavigationRole = "admin" | "solicitante" | "user";

export const ADMIN_NAVIGATION = [
  { id: "dashboard", label: "Dashboard" },
  { id: "materiais", label: "Materiais & EPIs" },
  { id: "requisicao", label: "Nova Requisição" },
  { id: "requisicoes", label: "Requisições" },
  { id: "entrada", label: "Entrada Estoque" },
  { id: "relatorios", label: "Relatórios" },
] as const;

export const REQUESTER_NAVIGATION = [
  { id: "requisicao", label: "Nova Requisição" },
] as const;

export function getNavigationForRole(role: NavigationRole) {
  return role === "admin" ? ADMIN_NAVIGATION : REQUESTER_NAVIGATION;
}

export function isAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === "almoxsuporte@forvia.com";
}

export function normalizeRole(role: NavigationRole | null | undefined, email?: string | null) {
  if (isAdminEmail(email)) return "admin" as const;
  return role === "admin" ? "admin" as const : "solicitante" as const;
}
