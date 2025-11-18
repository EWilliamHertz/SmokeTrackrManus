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
    stats: protectedProcedure
      .input(z.object({
        dateRange: z.enum(["today", "week", "month", "all"]).default("month"),
      }))
      .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Calculate date filter based on range
      let startDate: Date | null = null;
      if (input.dateRange === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (input.dateRange === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (input.dateRange === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      // "all" means no date filter (startDate = null)
      
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
        db.getTotalConsumption(userId, startDate),
        db.getConsumptionByType(userId, "Cigar", startDate),
        db.getConsumptionByType(userId, "Cigarillo", startDate),
        db.getConsumptionByType(userId, "Cigarette", startDate),
        db.getConsumptionByType(userId, "Snus", startDate),
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
        quantity: z.number().positive(), // Support decimals like 0.5
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
        quantity: z.number().positive(), // Support decimals like 0.5
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createConsumption({
          userId: ctx.user.id,
          productId: input.productId,
          consumptionDate: input.consumptionDate,
          quantity: input.quantity.toString(),
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        productId: z.number(),
        consumptionDate: z.date(),
        quantity: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateConsumption(input.id, ctx.user.id, {
          productId: input.productId,
          consumptionDate: input.consumptionDate,
          quantity: input.quantity.toString(),
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteConsumption(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Giveaways
  giveaways: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getGiveawaysByUser(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number(),
        giveawayDate: z.string(),
        recipient: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createGiveaway({
          userId: ctx.user.id,
          productId: input.productId,
          quantity: input.quantity.toString(),
          giveawayDate: new Date(input.giveawayDate),
          recipient: input.recipient,
          notes: input.notes,
        });
        return { success: true };
      }),
  }),

  // Import/Export
  importExport: importExportRouter,

  // Public share view
  share: router({
    getPublicData: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const settings = await db.getUserSettingsByShareToken(input.token);
        if (!settings) {
          throw new Error("Invalid share token");
        }
        
        const userId = settings.userId;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        // Parse share preferences (default to all visible)
        const preferences = settings.sharePreferences 
          ? JSON.parse(settings.sharePreferences)
          : { dashboard: true, history: true, inventory: true, purchases: true };
        
        const [
          monthlySpent,
          totalConsumed,
          totalCigars,
          totalCigarillos,
          totalCigarettes,
          totalSnus,
          products,
          consumption,
          purchases,
          giveaways,
        ] = await Promise.all([
          db.getMonthlySpending(userId, currentYear, currentMonth),
          db.getTotalConsumption(userId),
          db.getConsumptionByType(userId, "Cigar"),
          db.getConsumptionByType(userId, "Cigarillo"),
          db.getConsumptionByType(userId, "Cigarette"),
          db.getConsumptionByType(userId, "Snus"),
          db.getUserProducts(userId),
          db.getUserConsumption(userId),
          db.getUserPurchases(userId),
          db.getGiveawaysByUser(userId),
        ]);
        
        const monthlyBudget = Number(settings.monthlyBudget || 500);
        
        return {
          stats: {
            monthlyBudget,
            monthlySpent,
            remainingBudget: monthlyBudget - monthlySpent,
            totalConsumed,
            totalCigars,
            totalCigarillos,
            totalCigarettes,
            totalSnus,
          },
          preferences,
          products,
          consumption,
          purchases,
          giveaways,
        };
      }),
  }),

  // Settings
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getUserSettings(ctx.user.id);
      return settings || { monthlyBudget: "500.00", currency: "SEK", shareToken: null, weeklyReportsEnabled: false };
    }),
    
    update: protectedProcedure
      .input(z.object({
        monthlyBudget: z.number().positive().optional(),
        currency: z.string().optional(),
        weeklyReportsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: any = { userId: ctx.user.id };
        if (input.monthlyBudget !== undefined) {
          updateData.monthlyBudget = input.monthlyBudget.toString();
        }
        if (input.currency !== undefined) {
          updateData.currency = input.currency;
        }
        if (input.weeklyReportsEnabled !== undefined) {
          updateData.weeklyReportsEnabled = input.weeklyReportsEnabled;
        }
        await db.upsertUserSettings(updateData);
        return { success: true };
      }),
    
    generateShareToken: protectedProcedure.mutation(async ({ ctx }) => {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await db.updateUserSettings(ctx.user.id, { shareToken: token });
      return { token };
    }),
    
    updateSharePreferences: protectedProcedure
      .input(z.object({
        dashboard: z.boolean(),
        history: z.boolean(),
        inventory: z.boolean(),
        purchases: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserSettings(ctx.user.id, { 
          sharePreferences: JSON.stringify(input) 
        });
        return { success: true };
      }),
    
    revokeShareToken: protectedProcedure.mutation(async ({ ctx }) => {
      await db.updateUserSettings(ctx.user.id, { shareToken: null });
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
