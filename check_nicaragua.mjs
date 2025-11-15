import { drizzle } from "drizzle-orm/mysql2";
import { products, purchases, consumption, giveaways } from "./drizzle/schema.ts";
import { eq, sum } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const nicaragua = await db.select().from(products).where(eq(products.name, "Nicaragua Short Puritos"));
console.log("Nicaragua product:", JSON.stringify(nicaragua, null, 2));

const pur = await db.select().from(purchases).where(eq(purchases.productId, nicaragua[0].id));
console.log("\nPurchases:", JSON.stringify(pur, null, 2));

const con = await db.select().from(consumption).where(eq(consumption.productId, nicaragua[0].id));
console.log("\nConsumption:", JSON.stringify(con, null, 2));

const giv = await db.select().from(giveaways).where(eq(giveaways.productId, nicaragua[0].id));
console.log("\nGiveaways:", JSON.stringify(giv, null, 2));

const totalPur = pur.reduce((sum, p) => sum + parseFloat(p.quantity), 0);
const totalCon = con.reduce((sum, c) => sum + parseFloat(c.quantity), 0);
const totalGiv = giv.reduce((sum, g) => sum + parseFloat(g.quantity), 0);

console.log("\n=== TOTALS ===");
console.log("Purchased:", totalPur);
console.log("Consumed:", totalCon);
console.log("Given Away:", totalGiv);
console.log("Stock:", totalPur - totalCon - totalGiv);
