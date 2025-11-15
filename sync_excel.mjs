import { getDb } from './server/db.ts';
import { consumption } from './drizzle/schema.ts';
import { and, eq, sql } from 'drizzle-orm';
import fs from 'fs';

const excelData = JSON.parse(fs.readFileSync('/home/ubuntu/excel_consumption.json', 'utf-8'));

const productIds = {
  'Brobergs Arcadia': 1,
  'Handelsgold Blond': 2,
  'Handelsgold Blue': 3,
  'Handelsgold Red': 4,
  'Marlboro Crafted 100s': 5,
  'Nicaragua Short Puritos': 6,
  'Panetelas': 7,
  'Reserve 10th Anniversary Puritos': 8,
  'XQS Strawberry Kiwi': 13
};

const db = await getDb();
if (!db) {
  console.error('Could not connect to database');
  process.exit(1);
}

console.log(`Processing ${excelData.length} Excel entries...`);

let inserted = 0;
let skipped = 0;

for (const entry of excelData) {
  const { product, date, quantity } = entry;
  
  if (!productIds[product]) {
    console.log(`Skipping unknown product: ${product}`);
    continue;
  }
  
  const productId = productIds[product];
  
  // Check if entry already exists
  const existing = await db.select()
    .from(consumption)
    .where(
      and(
        eq(consumption.userId, 1),
        eq(consumption.productId, productId),
        sql`DATE(${consumption.consumptionDate}) = ${date}`,
        eq(consumption.quantity, quantity)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    skipped++;
  } else {
    // Insert new entry
    await db.insert(consumption).values({
      userId: 1,
      productId,
      quantity,
      consumptionDate: new Date(date + 'T12:00:00Z'),
      createdAt: new Date()
    });
    inserted++;
  }
  
  if ((inserted + skipped) % 20 === 0) {
    console.log(`Progress: ${inserted + skipped}/${excelData.length} (${inserted} new, ${skipped} existing)`);
  }
}

console.log(`\nSync complete!`);
console.log(`  Inserted: ${inserted} new entries`);
console.log(`  Skipped: ${skipped} existing entries`);
console.log(`  Total processed: ${inserted + skipped}`);

process.exit(0);
