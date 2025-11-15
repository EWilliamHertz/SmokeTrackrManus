import { db } from './server/db.js';
import { consumption, products } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';

const entries = await db.select({
  date: consumption.consumptionDate,
  product: products.name,
  quantity: consumption.quantity
})
.from(consumption)
.leftJoin(products, eq(consumption.productId, products.id))
.orderBy(consumption.consumptionDate, products.name);

const formatted = entries.map(e => ({
  date: e.date.toISOString().split('T')[0],
  product: e.product,
  quantity: parseFloat(e.quantity)
}));

fs.writeFileSync('/home/ubuntu/db_consumption.json', JSON.stringify(formatted, null, 2));
console.log(`Exported ${formatted.length} entries from database`);
