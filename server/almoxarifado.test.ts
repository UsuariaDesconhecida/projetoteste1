import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getNavigationForRole, isAdminEmail, normalizeRole } from "../shared/navigation";

describe("Almoxarifado Forvia Advanced API & Business Logic Tests", () => {
  it("promove somente o e-mail corporativo do almoxarifado para admin", () => {
    expect(isAdminEmail("almoxsuporte@forvia.com")).toBe(true);
    expect(isAdminEmail("ALMOXSUPORTE@FORVIA.COM")).toBe(true);
    expect(isAdminEmail("colaborador@forvia.com")).toBe(false);
    expect(normalizeRole("solicitante", "almoxsuporte@forvia.com")).toBe("admin");
    expect(normalizeRole("admin", "colaborador@forvia.com")).toBe("admin");
    expect(normalizeRole("user", "colaborador@forvia.com")).toBe("solicitante");
  });

  it("expõe somente Nova Requisição ao solicitante e os seis módulos ao admin", () => {
    expect(getNavigationForRole("solicitante").map((item) => item.label)).toEqual(["Nova Requisição"]);
    expect(getNavigationForRole("admin").map((item) => item.label)).toEqual([
      "Dashboard",
      "Materiais & EPIs",
      "Nova Requisição",
      "Requisições",
      "Entrada Estoque",
      "Relatórios",
    ]);
  });

  it("bloqueia rotas administrativas para solicitante não autenticado", async () => {
    const ctxRequester: TrpcContext = {
      user: {
        id: 4,
        openId: "requester_test",
        name: "Solicitante Teste",
        email: "colaborador@forvia.com",
        loginMethod: "oauth",
        role: "solicitante",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };
    const callerRequester = appRouter.createCaller(ctxRequester);

    await expect(callerRequester.requisition.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerRequester.stock.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerRequester.stock.movements()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite listar itens do catálogo publicamente", async () => {
    const ctx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };
    const caller = appRouter.createCaller(ctx);
    const items = await caller.catalog.list();
    expect(Array.isArray(items)).toBe(true);
  }, 15000);

  it("permite criar requisição e validar fluxo do admin", async () => {
    const ctxPublic: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };
    const callerPublic = appRouter.createCaller(ctxPublic);

    const items = await callerPublic.catalog.list();
    expect(items.length).toBeGreaterThan(0);
    const item = items.find((candidate) => candidate.stock > 0) ?? items[0]!;
    expect(item.stock).toBeGreaterThan(0);

    const reqResult = await callerPublic.requisition.create({
      requesterName: "Maria Souza",
      area: "Logística",
      itemId: item.id,
      quantity: 1,
      justification: "Teste de requisição automatizada",
    });

    expect(reqResult.success).toBe(true);
    const reqId = reqResult.id;

    // Contexto Admin
    const adminUser = {
      id: 999,
      openId: "admin_test",
      name: "Admin Teste",
      email: "almoxsuporte@forvia.com",
      loginMethod: "custom",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctxAdmin: TrpcContext = {
      user: adminUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };
    const callerAdmin = appRouter.createCaller(ctxAdmin);

    // Tentar aprovar
    const approvalRes = await callerAdmin.requisition.updateStatus({
      id: reqId,
      status: "aprovada",
      adminObservation: "Aprovado no teste automatizado",
    });
    expect(approvalRes.success).toBe(true);
  }, 15000);

  it("rejeita aprovação se quantidade solicitada for maior que o estoque", async () => {
    const ctxPublic: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };
    const callerPublic = appRouter.createCaller(ctxPublic);

    const items = await callerPublic.catalog.list();
    const item = items[0]!;

    // Requisitar quantidade massiva
    const reqResult = await callerPublic.requisition.create({
      requesterName: "Carlos Teste",
      area: "Injeção",
      itemId: item.id,
      quantity: 999999,
      justification: "Teste de estoque insuficiente",
    });

    const adminUser = {
      id: 999,
      openId: "admin_test",
      name: "Admin Teste",
      email: "almoxsuporte@forvia.com",
      loginMethod: "custom",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctxAdmin: TrpcContext = {
      user: adminUser,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    };
    const callerAdmin = appRouter.createCaller(ctxAdmin);

    await expect(
      callerAdmin.requisition.updateStatus({
        id: reqResult.id,
        status: "aprovada",
        adminObservation: "Tentativa de aprovação excessiva",
      })
    ).rejects.toThrow();
  }, 15000);
});
