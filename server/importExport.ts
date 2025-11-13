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
      
      // Get existing products first
      const existingProducts = await db.getUserProducts(userId);
      const productMap = new Map<string, number>();
      
      for (const existing of existingProducts) {
        productMap.set(existing.name, existing.id);
      }
      
      // Collect all unique product names from all sources
      const allProductNames = new Set<string>();
      input.products.forEach(p => allProductNames.add(p.name));
      input.purchases.forEach(p => allProductNames.add(p.productName));
      input.consumption.forEach(c => allProductNames.add(c.productName));
      
      // Create products that don't exist yet
      console.log(`[Import] Found ${allProductNames.size} unique products across all sheets`);
      console.log(`[Import] Existing products: ${productMap.size}`);
      
      for (const productName of Array.from(allProductNames)) {
        if (!productMap.has(productName)) {
          // Find product details from input.products or use defaults
          const productDetails = input.products.find(p => p.name === productName);
          console.log(`[Import] Creating missing product: ${productName} (type: ${productDetails?.type || "Other"})`);
          try {
            await db.createProduct({
              userId,
              name: productName,
              type: productDetails?.type || "Other",
              flavorDetail: productDetails?.flavorDetail,
            });
          } catch (error) {
            console.error(`[Import] Failed to create product ${productName}:`, error);
          }
        }
      }
      
      // Refresh product map with all products
      const allProducts = await db.getUserProducts(userId);
      productMap.clear();
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
      console.log(`[Import] Importing ${input.consumption.length} consumption entries`);
      let skipped = 0;
      let imported = 0;
      
      for (const cons of input.consumption) {
        const productId = productMap.get(cons.productName);
        if (!productId) {
          console.log(`[Import] Skipping consumption for unknown product: ${cons.productName}`);
          skipped++;
          continue;
        }
        
        try {
          await db.createConsumption({
            userId,
            productId,
            consumptionDate: new Date(cons.consumptionDate),
            quantity: cons.quantity.toString(),
          });
          imported++;
        } catch (error) {
          console.error(`[Import] Failed to create consumption for ${cons.productName}:`, error);
          skipped++;
        }
      }
      
      console.log(`[Import] Consumption import complete: ${imported} imported, ${skipped} skipped`);
      
      // Update settings if provided
      if (input.monthlyBudget) {
        await db.upsertUserSettings({
          userId,
          monthlyBudget: input.monthlyBudget.toString(),
          currency: "SEK",
        });
      }
      
      return { success: true, imported, skipped };
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
