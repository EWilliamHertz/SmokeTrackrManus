import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { importExportRouter } from "./importExport";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dashboard stats
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const [
        settings,
        monthlySpent,
        totalConsumed,
        totalCigars,
        totalCigarillos,
        totalCigarettes,
        totalSnus,
      ] = await Promise.all([
        db.getUserSettings(userId),
        db.getMonthlySpending(userId, currentYear, currentMonth),
        db.getTotalConsumption(userId),
        db.getConsumptionByType(userId, "Cigar"),
        db.getConsumptionByType(userId, "Cigarillo"),
        db.getConsumptionByType(userId, "Cigarette"),
        db.getConsumptionByType(userId, "Snus"),
      ]);
      
      const monthlyBudget = Number(settings?.monthlyBudget || 500);
      
      return {
        monthlyBudget,
        monthlySpent,
        remainingBudget: monthlyBudget - monthlySpent,
        totalConsumed,
        totalCigars,
        totalCigarillos,
        totalCigarettes,
        totalSnus,
      };
    }),
  }),

  // Products
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserProducts(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["Cigar", "Cigarillo", "Cigarette", "Snus", "Other"]),
        flavorDetail: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createProduct({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    inventory: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getProductInventory(ctx.user.id, input.productId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const products = await db.getUserProducts(ctx.user.id);
        return products.find(p => p.id === input.id);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        type: z.enum(["Cigar", "Cigarillo", "Cigarette", "Snus", "Other"]),
        flavorDetail: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateProduct(input.id, ctx.user.id, {
          name: input.name,
          type: input.type,
          flavorDetail: input.flavorDetail,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProduct(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Purchases
  purchases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPurchases(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        purchaseDate: z.date(),
        quantity: z.number().int().positive(),
        pricePerItem: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const totalCost = input.quantity * input.pricePerItem;
        await db.createPurchase({
          userId: ctx.user.id,
          productId: input.productId,
          purchaseDate: input.purchaseDate,
          quantity: input.quantity,
          pricePerItem: input.pricePerItem.toString(),
          totalCost: totalCost.toString(),
        });
        return { success: true };
      }),
  }),

  // Consumption
  consumption: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserConsumption(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        consumptionDate: z.date(),
        quantity: z.number().int().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createConsumption({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Import/Export
  importExport: importExportRouter,

  // Settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getUserSettings(ctx.user.id);
      return settings || { monthlyBudget: "500.00", currency: "SEK" };
    }),
    
    update: protectedProcedure
      .input(z.object({
        monthlyBudget: z.number().positive(),
        currency: z.string().default("SEK"),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserSettings({
          userId: ctx.user.id,
          monthlyBudget: input.monthlyBudget.toString(),
          currency: input.currency,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
