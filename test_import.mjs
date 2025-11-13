import XLSX from 'xlsx';
import fs from 'fs';

const file = fs.readFileSync('/home/ubuntu/upload/SmokeTracker_Working.xlsx');
const wb = XLSX.read(file);

console.log('=== TESTING FRONTEND IMPORT LOGIC ===\n');

// Parse sheets
const consumptionSheet = wb.Sheets["Consumption"];
const consumptionData = XLSX.utils.sheet_to_json(consumptionSheet);

const inventorySheet = wb.Sheets["Inventory"];
const inventoryData = XLSX.utils.sheet_to_json(inventorySheet);

const purchaseSheet = wb.Sheets["Purchase Log"];
const purchaseData = XLSX.utils.sheet_to_json(purchaseSheet);

const dashboardSheet = wb.Sheets["Dashboard"];
const dashboardData = XLSX.utils.sheet_to_json(dashboardSheet);

console.log(`Parsed ${consumptionData.length} consumption rows`);
console.log(`Parsed ${inventoryData.length} inventory rows`);
console.log(`Parsed ${purchaseData.length} purchase rows`);
console.log(`Parsed ${dashboardData.length} dashboard rows\n`);

// Test product parsing
const products = inventoryData.map((row) => ({
  name: row.Product || row.product || row.Name || row.name,
  type: (row.Type || row.type || "Other"),
  flavorDetail: row.Flavor || row.flavor || row["Flavor Detail"] || undefined,
})).filter((p) => p.name);

console.log(`=== PRODUCTS (${products.length}) ===`);
products.slice(0, 3).forEach(p => console.log(JSON.stringify(p)));

// Test purchase parsing
const purchases = purchaseData.map((row) => ({
  productName: row.Product || row.product,
  purchaseDate: row.Date || row.date,
  quantity: parseInt(row.Quantity || row.quantity || "0"),
  pricePerItem: parseFloat(row["Price Per Item"] || row.pricePerItem || row["Price per unit"] || "0"),
})).filter((p) => p.productName);

console.log(`\n=== PURCHASES (${purchases.length}) ===`);
purchases.slice(0, 3).forEach(p => console.log(JSON.stringify(p)));

// Test consumption parsing (CURRENT LOGIC)
const consumption = consumptionData.map((row) => {
  const date = row.Date || row.date;
  const time = row.Time || row.time;
  
  // Handle date parsing
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

console.log(`\n=== CONSUMPTION (${consumption.length}) ===`);
consumption.slice(0, 5).forEach(c => {
  console.log(JSON.stringify(c));
  // Test if date is valid
  const d = new Date(c.consumptionDate);
  if (isNaN(d.getTime())) {
    console.log(`  ❌ INVALID DATE: ${c.consumptionDate}`);
  } else {
    console.log(`  ✅ Valid: ${d.toISOString()}`);
  }
});

// Test budget parsing
const budgetRow = dashboardData.find((row) => 
  (row.Label || row.label || "").toLowerCase().includes("budget")
);
const monthlyBudget = budgetRow ? parseFloat(budgetRow.Value || budgetRow.value || "500") : undefined;

console.log(`\n=== BUDGET ===`);
console.log(`Monthly Budget: ${monthlyBudget} SEK`);
