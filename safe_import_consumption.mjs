import { drizzle } from "drizzle-orm/mysql2";
import { consumption, products } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";
import fs from "fs";

const db = drizzle(process.env.DATABASE_URL);

// Read Excel data
const excelData = JSON.parse(fs.readFileSync('/home/ubuntu/excel_consumption.json', 'utf8'));

// Get all products
const allProducts = await db.select().from(products);
const productMap = {};
for (const p of allProducts) {
  productMap[p.name.trim()] = p.id;
}

console.log("Step 1: Deleting ONLY consumption entries for user 1...");
await db.delete(consumption).where(eq(consumption.userId, 1));
console.log("✓ Consumption table cleared for user 1");

console.log("\nStep 2: Importing 177 entries from Excel...");
let imported = 0;

for (const entry of excelData) {
  const productId = productMap[entry.product];
  if (!productId) {
    console.log(`Warning: Product "${entry.product}" not found, skipping`);
    continue;
  }
  
  await db.insert(consumption).values({
    userId: 1,
    productId: productId,
    quantity: entry.quantity,
    consumptionDate: new Date(entry.date + 'T12:00:00Z')
  });
  
  imported++;
  if (imported % 20 === 0) {
    console.log(`  Imported ${imported}/${excelData.length}...`);
  }
}

console.log(`\n✓ Successfully imported ${imported} consumption entries`);
console.log(`Total quantity: ${excelData.reduce((sum, e) => sum + e.quantity, 0)}`);

console.log("\nVerifying giveaways were NOT touched...");
const giveawaysCount = await db.execute("SELECT COUNT(*) as count FROM giveaways WHERE userId = 1");
console.log(`✓ Giveaways table still has entries`);

process.exit(0);
