import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Download, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
  });
  
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Settings updated!");
    },
  });

  const exportData = trpc.importExport.exportData.useQuery(undefined, {
    enabled: false,
  });

  const importData = trpc.importExport.importData.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.purchases.list.invalidate();
      utils.consumption.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Data imported successfully!");
    },
    onError: (error) => {
      toast.error("Import failed: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      monthlyBudget: parseFloat(monthlyBudget),
      currency: "SEK",
    });
  };

  const handleExport = async () => {
    const data = await exportData.refetch();
    if (!data.data) {
      toast.error("Failed to export data");
      return;
    }

    const wb = XLSX.utils.book_new();

    const consumptionData = data.data.consumption.map(c => ({
      Date: new Date(c.consumptionDate).toISOString().split('T')[0],
      Time: new Date(c.consumptionDate).toTimeString().slice(0, 5),
      Product: c.productId,
      Quantity: c.quantity,
    }));
    const consumptionWs = XLSX.utils.json_to_sheet(consumptionData);
    XLSX.utils.book_append_sheet(wb, consumptionWs, "Consumption");

    const inventoryData = data.data.products.map(p => ({
      Product: p.name,
      Type: p.type,
      Flavor: p.flavorDetail || "",
    }));
    const inventoryWs = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, inventoryWs, "Inventory");

    const purchaseData = data.data.purchases.map(p => ({
      Date: new Date(p.purchaseDate).toISOString().split('T')[0],
      Product: p.productId,
      Quantity: p.quantity,
      "Price Per Item": parseFloat(p.pricePerItem),
      "Total Cost": parseFloat(p.totalCost),
    }));
    const purchaseWs = XLSX.utils.json_to_sheet(purchaseData);
    XLSX.utils.book_append_sheet(wb, purchaseWs, "Purchase Log");

    const dashboardData = [
      { Label: "Monthly Budget (SEK)", Value: parseFloat(data.data.settings?.monthlyBudget || "500") },
    ];
    const dashboardWs = XLSX.utils.json_to_sheet(dashboardData);
    XLSX.utils.book_append_sheet(wb, dashboardWs, "Dashboard");

    XLSX.writeFile(wb, `SmokeTrackr_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data exported!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      const consumptionSheet = wb.Sheets["Consumption"];
      const consumptionData = XLSX.utils.sheet_to_json<any>(consumptionSheet);
      
      const inventorySheet = wb.Sheets["Inventory"];
      const inventoryData = XLSX.utils.sheet_to_json<any>(inventorySheet);
      
      const purchaseSheet = wb.Sheets["Purchase Log"];
      const purchaseData = XLSX.utils.sheet_to_json<any>(purchaseSheet);
      
      const dashboardSheet = wb.Sheets["Dashboard"];
      const dashboardData = XLSX.utils.sheet_to_json<any>(dashboardSheet);

      const products = inventoryData.map((row: any) => ({
        name: row["Product Name"] || row.Product || row.product || row.Name || row.name,
        type: (row.Type || row.type || "Other") as "Cigar" | "Cigarillo" | "Cigarette" | "Snus" | "Other",
        flavorDetail: row["Flavor/Detail"] || row.Flavor || row.flavor || row["Flavor Detail"] || undefined,
      })).filter((p: any) => p.name);

      const purchases = purchaseData.map((row: any) => ({
        productName: row["Product Name"] || row.Product || row.product,
        purchaseDate: row["Purchase Date"] || row.Date || row.date,
        quantity: parseInt(row.Quantity || row.quantity || "0"),
        pricePerItem: parseFloat(row["Price Per Item (SEK)"] || row["Price Per Item"] || row.pricePerItem || row["Price per unit"] || "0"),
      })).filter((p: any) => p.productName);

      const consumption = consumptionData.map((row: any) => {
        const date = row.Date || row.date;
        const time = row.Time || row.time;
        
        // Handle date parsing
        let consumptionDate: string;
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
      }).filter((c: any) => c.productName && c.consumptionDate);

      const budgetRow = dashboardData.find((row: any) => 
        (row["Smoke Tracker Dashboard"] || row.Label || row.label || "").toLowerCase().includes("budget")
      );
      const monthlyBudget = budgetRow ? parseFloat(budgetRow.__EMPTY || budgetRow.Value || budgetRow.value || "500") : undefined;

      await importData.mutateAsync({
        products,
        purchases,
        consumption,
        monthlyBudget,
      });

    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to parse Excel file");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExport} className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Data to Excel
            </Button>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                id="file-import"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full"
                variant="outline"
                disabled={importData.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importData.isPending ? "Importing..." : "Import Data from Excel"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (SEK)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={settings?.monthlyBudget || "500.00"}
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? "Saving..." : "Save Budget"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{user?.name || user?.email}</p>
            </div>
            <Button variant="destructive" onClick={() => logout()} className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
