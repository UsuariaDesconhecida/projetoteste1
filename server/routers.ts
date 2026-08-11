import { timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

const ADMIN_OPEN_ID = "custom_admin_almoxadm_suporte";
const ADMIN_DISPLAY_NAME = "Administrador Almoxarifado";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    adminLogin: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(12) }))
      .mutation(async ({ input, ctx }) => {
        const expectedEmail = ENV.adminLoginEmail.trim().toLowerCase();
        const providedEmail = input.email.trim().toLowerCase();
        const isValid = Boolean(ENV.adminLoginEmail && ENV.adminLoginPassword)
          && safeEqual(providedEmail, expectedEmail)
          && safeEqual(input.password, ENV.adminLoginPassword);

        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais administrativas inválidas." });
        }

        await db.upsertUser({
          openId: ADMIN_OPEN_ID,
          name: ADMIN_DISPLAY_NAME,
          email: expectedEmail,
          loginMethod: "admin",
          role: "admin",
          lastSignedIn: new Date(),
        });
        const user = await db.getUserByOpenId(ADMIN_OPEN_ID);
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar a sessão administrativa." });
        }

        const sessionToken = await sdk.createSessionToken(ADMIN_OPEN_ID, {
          name: ADMIN_DISPLAY_NAME,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true as const, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  catalog: router({
    list: publicProcedure.query(async () => {
      return await db.getItems();
    }),
    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        category: z.string().min(1),
        unit: z.string().min(1),
        stock: z.number().int().min(0),
        minStock: z.number().int().min(0),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem cadastrar itens." });
        }
        return await db.createItem(input);
      }),
  }),

  requisition: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
      }
      return await db.getRequisitions();
    }),
    create: publicProcedure
      .input(z.object({
        requesterName: z.string().min(2),
        area: z.string().min(2),
        itemId: z.number().int(),
        quantity: z.number().int().min(1),
        justification: z.string().min(3),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRequisition({
          ...input,
          status: 'pendente',
        });
        return { id, success: true };
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        status: z.enum(['aprovada', 'recusada']),
        adminObservation: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem aprovar ou recusar requisições." });
        }
        await db.updateRequisitionStatus(input.id, input.status, input.adminObservation || "", ctx.user.name || "Administrador");
        return { success: true };
      }),
  }),

  stock: router({
    movements: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem ver o histórico de movimentações." });
      }
      return await db.getStockMovements();
    }),
    move: protectedProcedure
      .input(z.object({
        itemId: z.number().int(),
        type: z.enum(['entrada', 'saida']),
        quantity: z.number().int().min(1),
        reason: z.string().min(2),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem registrar entradas e saídas de estoque." });
        }
        await db.createStockMovement({
          ...input,
          responsible: ctx.user.name || "Administrador",
        });
        return { success: true };
      }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem ver estatísticas completas." });
      }
      return await db.getDashboardStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
