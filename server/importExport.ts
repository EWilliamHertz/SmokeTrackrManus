import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const importExportRouter = router({
  // Import data from Excel structure
  importData: protectedProcedure
    .input(z.object({
      products: z.array(z.object({
        name: z.string(),
        type: z.enum(["Cigar", "Cigarillo", "Cigarette", "Snus", "Other"]),
        flavorDetail: z.string().optional(),
      })),
      purchases: z.array(z.object({
        productName: z.string(),
        purchaseDate: z.string(),
        quantity: z.number(),
        pricePerItem: z.number(),
      })),
      consumption: z.array(z.object({
        productName: z.string(),
        consumptionDate: z.string(),
        quantity: z.number(),
      })),
      monthlyBudget: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      
      // Create products and build name-to-id map
      const productMap = new Map<string, number>();
      
      for (const product of input.products) {
        await db.createProduct({
          userId,
          name: product.name,
          type: product.type,
          flavorDetail: product.flavorDetail,
        });
      }
      
      // Fetch all products to get IDs
      const allProducts = await db.getUserProducts(userId);
      for (const product of allProducts) {
        productMap.set(product.name, product.id);
      }
      
      // Import purchases
      for (const purchase of input.purchases) {
        const productId = productMap.get(purchase.productName);
        if (!productId) continue;
        
        const totalCost = purchase.quantity * purchase.pricePerItem;
        await db.createPurchase({
          userId,
          productId,
          purchaseDate: new Date(purchase.purchaseDate),
          quantity: purchase.quantity,
          pricePerItem: purchase.pricePerItem.toString(),
          totalCost: totalCost.toString(),
        });
      }
      
      // Import consumption
      for (const cons of input.consumption) {
        const productId = productMap.get(cons.productName);
        if (!productId) continue;
        
        await db.createConsumption({
          userId,
          productId,
          consumptionDate: new Date(cons.consumptionDate),
          quantity: cons.quantity,
        });
      }
      
      // Update settings if provided
      if (input.monthlyBudget) {
        await db.upsertUserSettings({
          userId,
          monthlyBudget: input.monthlyBudget.toString(),
          currency: "SEK",
        });
      }
      
      return { success: true };
    }),

  // Export all user data
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    
    const [products, purchases, consumption, settings] = await Promise.all([
      db.getUserProducts(userId),
      db.getUserPurchases(userId),
      db.getUserConsumption(userId),
      db.getUserSettings(userId),
    ]);
    
    return {
      products,
      purchases,
      consumption,
      settings,
    };
  }),
});
