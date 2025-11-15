import { getDb } from './server/db.ts';
import { consumption } from './drizzle/schema.ts';
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

console.log(`Importing ${excelData.length} entries from Excel...`);

let imported = 0;
let skipped = 0;

for (const entry of excelData) {
  const { product, date, quantity } = entry;
  
  if (!productIds[product]) {
    console.log(`Skipping unknown product: ${product}`);
    skipped++;
    continue;
  }
  
  const productId = productIds[product];
  
  // Insert entry (no duplicate check - import ALL entries from Excel)
  await db.insert(consumption).values({
    userId: 1,
    productId,
    quantity,
    consumptionDate: new Date(date + 'T12:00:00Z'),
    createdAt: new Date()
  });
  imported++;
  
  if (imported % 20 === 0) {
    console.log(`Progress: ${imported}/${excelData.length}`);
  }
}

console.log(`\nImport complete!`);
console.log(`  Imported: ${imported} entries`);
console.log(`  Skipped: ${skipped} entries`);

// Verify
const result = await db.execute(`
  SELECT COUNT(*) as count, SUM(quantity) as total 
  FROM consumption 
  WHERE userId = 1
`);

console.log(`\nVerification:`);
console.log(`  Database entries: ${result[0][0].count}`);
console.log(`  Database total quantity: ${result[0][0].total}`);
console.log(`  Expected from Excel: 177 entries, 145.13 total`);

process.exit(0);
