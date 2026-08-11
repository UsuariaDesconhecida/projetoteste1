import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "@shared/const";
import type { TrpcContext } from "./_core/context";
import { sdk } from "./_core/sdk";

function createContext() {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const ctx: TrpcContext = {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, cookies };
}

describe("auth.adminLogin", () => {
  it("valida as credenciais configuradas e cria uma sessão administrativa", async () => {
    const { ctx, cookies } = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.adminLogin({
      email: process.env.ADMIN_LOGIN_EMAIL!,
      password: process.env.ADMIN_LOGIN_PASSWORD!,
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("almoxadm@suporte.com");
    expect(result.user.role).toBe("admin");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.value).toBeTruthy();
    const session = await sdk.verifySession(cookies[0]!.value);
    expect(session?.openId).toBe("custom_admin_almoxadm_suporte");
  }, 15000);

  it("resolve o usuário admin em uma requisição subsequente com o cookie emitido", async () => {
    const { ctx, cookies } = createContext();
    const caller = appRouter.createCaller(ctx);
    await caller.auth.adminLogin({
      email: process.env.ADMIN_LOGIN_EMAIL!,
      password: process.env.ADMIN_LOGIN_PASSWORD!,
    });

    const authenticatedUser = await sdk.authenticateRequest({
      protocol: "https",
      headers: { cookie: `${COOKIE_NAME}=${cookies[0]!.value}` },
    } as TrpcContext["req"]);

    expect(authenticatedUser.email).toBe("almoxadm@suporte.com");
    expect(authenticatedUser.role).toBe("admin");
  }, 15000);

  it("recusa uma senha incorreta", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.adminLogin({
        email: process.env.ADMIN_LOGIN_EMAIL!,
        password: "senha-incorreta",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
