import { getDb } from './server/db.js';
import fs from 'fs';

const sql = fs.readFileSync('/home/ubuntu/sync_consumption_safe.sql', 'utf-8');
const statements = sql.split(';').filter(s => s.trim().length > 0);

console.log(`Executing ${statements.length} INSERT statements...`);

const db = await getDb();
if (!db) {
  console.error('Could not connect to database');
  process.exit(1);
}

let inserted = 0;
let skipped = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i].trim();
  if (!stmt) continue;
  
  try {
    const result = await db.execute(stmt);
    if (result[0].affectedRows > 0) {
      inserted++;
    } else {
      skipped++;
    }
    
    if ((i + 1) % 20 === 0) {
      console.log(`Progress: ${i + 1}/${statements.length} (${inserted} inserted, ${skipped} skipped)`);
    }
  } catch (error) {
    console.error(`Error on statement ${i + 1}:`, error.message);
  }
}

console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
process.exit(0);
