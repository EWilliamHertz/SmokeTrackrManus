import { getDb } from './server/db.ts';
import { consumption } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('Could not connect to database');
  process.exit(1);
}

console.log('Finding and removing duplicate consumption entries...');

// Find duplicates
const duplicates = await db.execute(sql`
  SELECT userId, productId, DATE(consumptionDate) as date, quantity, COUNT(*) as count
  FROM consumption
  WHERE userId = 1
  GROUP BY userId, productId, DATE(consumptionDate), quantity
  HAVING COUNT(*) > 1
`);

console.log(`Found ${duplicates[0].length} groups of duplicates`);

let totalRemoved = 0;

// For each duplicate group, keep the first entry and delete the rest
for (const dup of duplicates[0]) {
  const { userId, productId, date, quantity, count } = dup;
  
  // Get all IDs for this duplicate group
  const entries = await db.execute(sql`
    SELECT id 
    FROM consumption 
    WHERE userId = ${userId}
      AND productId = ${productId}
      AND DATE(consumptionDate) = ${date}
      AND quantity = ${quantity}
    ORDER BY id
  `);
  
  // Keep the first one, delete the rest
  const idsToDelete = entries[0].slice(1).map(e => e.id);
  
  if (idsToDelete.length > 0) {
    await db.execute(sql`
      DELETE FROM consumption 
      WHERE id IN (${sql.join(idsToDelete, sql`, `)})
    `);
    
    totalRemoved += idsToDelete.length;
    console.log(`Removed ${idsToDelete.length} duplicates for productId=${productId}, date=${date}, qty=${quantity}`);
  }
}

console.log(`\nDone! Removed ${totalRemoved} duplicate entries`);

// Check final count
const final = await db.execute(sql`
  SELECT COUNT(*) as total, SUM(quantity) as sum 
  FROM consumption 
  WHERE userId = 1
`);

console.log(`\nFinal stats:`);
console.log(`  Total entries: ${final[0][0].total}`);
console.log(`  Total quantity: ${final[0][0].sum}`);

process.exit(0);
