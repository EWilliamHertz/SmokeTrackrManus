import XLSX from 'xlsx';
import fs from 'fs';

const file = fs.readFileSync('/home/ubuntu/upload/SmokeTracker_Working.xlsx');
const wb = XLSX.read(file);

const inventorySheet = wb.Sheets["Inventory"];
const inventoryData = XLSX.utils.sheet_to_json(inventorySheet);

const purchaseSheet = wb.Sheets["Purchase Log"];
const purchaseData = XLSX.utils.sheet_to_json(purchaseSheet);

const consumptionSheet = wb.Sheets["Consumption"];
const consumptionData = XLSX.utils.sheet_to_json(consumptionSheet);

const dashboardSheet = wb.Sheets["Dashboard"];
const dashboardData = XLSX.utils.sheet_to_json(dashboardSheet);

// Parse exactly as frontend does
const products = inventoryData.map((row) => ({
  name: row["Product Name"] || row.Product || row.product || row.Name || row.name,
  type: (row.Type || row.type || "Other"),
  flavorDetail: row["Flavor/Detail"] || row.Flavor || row.flavor || row["Flavor Detail"] || undefined,
})).filter((p) => p.name);

const purchases = purchaseData.map((row) => ({
  productName: row["Product Name"] || row.Product || row.product,
  purchaseDate: row["Purchase Date"] || row.Date || row.date,
  quantity: parseInt(row.Quantity || row.quantity || "0"),
  pricePerItem: parseFloat(row["Price Per Item (SEK)"] || row["Price Per Item"] || row.pricePerItem || row["Price per unit"] || "0"),
})).filter((p) => p.productName);

const consumption = consumptionData.map((row) => {
  const date = row.Date || row.date;
  const time = row.Time || row.time;
  
  let consumptionDate;
  if (time && time !== "None" && time !== null) {
    consumptionDate = `${date}T${time}`;
  } else {
    consumptionDate = `${date}T00:00:00`;
  }
  
  return {
    productName: row.Product || row.product,
    consumptionDate,
    quantity: parseInt(row.Quantity || row.quantity || "0"),
  };
}).filter((c) => c.productName && c.consumptionDate);

const budgetRow = dashboardData.find((row) => 
  (row["Smoke Tracker Dashboard"] || row.Label || row.label || "").toLowerCase().includes("budget")
);
const monthlyBudget = budgetRow ? parseFloat(budgetRow.__EMPTY || budgetRow.Value || budgetRow.value || "500") : undefined;

console.log("=== PARSED DATA ===");
console.log(`Products: ${products.length}`);
console.log(`Purchases: ${purchases.length}`);
console.log(`Consumption: ${consumption.length}`);
console.log(`Budget: ${monthlyBudget}`);

// Test date validation
console.log("\n=== TESTING CONSUMPTION DATES ===");
let invalidCount = 0;
consumption.forEach((c, i) => {
  const d = new Date(c.consumptionDate);
  if (isNaN(d.getTime())) {
    console.log(`❌ Row ${i}: Invalid date "${c.consumptionDate}" for ${c.productName}`);
    invalidCount++;
  }
});

if (invalidCount === 0) {
  console.log(`✅ All ${consumption.length} consumption dates are valid!`);
} else {
  console.log(`\n❌ Found ${invalidCount} invalid dates`);
}

// Test purchase dates
console.log("\n=== TESTING PURCHASE DATES ===");
let invalidPurchases = 0;
purchases.forEach((p, i) => {
  const d = new Date(p.purchaseDate);
  if (isNaN(d.getTime())) {
    console.log(`❌ Row ${i}: Invalid date "${p.purchaseDate}" for ${p.productName}`);
    invalidPurchases++;
  }
});

if (invalidPurchases === 0) {
  console.log(`✅ All ${purchases.length} purchase dates are valid!`);
} else {
  console.log(`\n❌ Found ${invalidPurchases} invalid purchase dates`);
}

// Write payload to file for API testing
const payload = {
  products,
  purchases,
  consumption,
  monthlyBudget
};

fs.writeFileSync('/home/ubuntu/import_payload.json', JSON.stringify(payload, null, 2));
console.log("\n✅ Payload written to /home/ubuntu/import_payload.json");
console.log(`\nPayload size: ${JSON.stringify(payload).length} bytes`);
