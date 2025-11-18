import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Download, Upload, Share2, Copy, RefreshCw, Gift, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Link } from "wouter";

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
  });
  
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [weeklyReportsEnabled, setWeeklyReportsEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [sharePrefs, setSharePrefs] = useState({
    dashboard: true,
    history: true,
    inventory: true,
    purchases: true,
  });

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

  const generateShareToken = trpc.settings.generateShareToken.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/share/${data.token}`;
      setShareUrl(url);
      toast.success("Share link generated!");
    },
    onError: (error) => {
      toast.error("Failed to generate link: " + error.message);
    },
  });

  const updateSharePreferences = trpc.settings.updateSharePreferences.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Share preferences updated!");
    },
  });

  const revokeShareToken = trpc.settings.revokeShareToken.useMutation({
    onSuccess: () => {
      setShareUrl("");
      utils.settings.get.invalidate();
      toast.success("Share link revoked!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      monthlyBudget: parseFloat(monthlyBudget),
      currency: "SEK",
    });
  };

  const handleWeeklyReportsToggle = (checked: boolean) => {
    setWeeklyReportsEnabled(checked);
    updateSettings.mutate({
      weeklyReportsEnabled: checked,
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

      // Handle both "Consumption" and "Smoke Log" sheet names
      const consumptionSheet = wb.Sheets["Consumption"] || wb.Sheets["Smoke Log"];
      if (!consumptionSheet) {
        toast.error("Could not find Consumption or Smoke Log sheet");
        return;
      }
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
        let date = row.Date || row.date;
        let time = row.Time || row.time;
        
        // Convert Excel serial date to JS Date if needed
        if (typeof date === 'number') {
          const excelEpoch = new Date(1899, 11, 30); // Excel epoch
          const jsDate = new Date(excelEpoch.getTime() + date * 86400000);
          date = jsDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
        }
        
        // Convert Excel time decimal to HH:MM if needed
        if (typeof time === 'number') {
          // Handle time values > 1.0 (wrap around to 24-hour format)
          const normalizedTime = time % 1;
          const hours = Math.floor(normalizedTime * 24);
          const minutes = Math.floor((normalizedTime * 24 - hours) * 60);
          time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        
        // Build final datetime string
        let consumptionDate: string;
        if (time && time !== "None" && time !== null && time !== undefined) {
          // Ensure time has seconds
          const timeStr = time.includes(':') ? time : `${time}:00`;
          const finalTime = timeStr.split(':').length === 2 ? `${timeStr}:00` : timeStr;
          consumptionDate = `${date}T${finalTime}`;
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
            <Link href="/giveaways">
              <Button className="w-full" variant="outline">
                <Gift className="w-4 h-4 mr-2" />
                View Giveaway History
              </Button>
            </Link>
            
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
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Weekly Email Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Receive automated weekly summaries every Monday with your cost trends, budget status, and top consumed products.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="weekly-reports"
                checked={settings?.weeklyReportsEnabled || weeklyReportsEnabled}
                onCheckedChange={handleWeeklyReportsToggle}
              />
              <label
                htmlFor="weekly-reports"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Enable weekly email reports
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Share Your Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate a public read-only link to share your consumption stats with others.
            </p>
            
            <div className="space-y-2 border border-border rounded-lg p-3">
              <p className="text-sm font-medium">Choose what to share:</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="share-dashboard"
                    checked={sharePrefs.dashboard}
                    onCheckedChange={(checked) => {
                      const newPrefs = { ...sharePrefs, dashboard: !!checked };
                      setSharePrefs(newPrefs);
                      if (settings?.shareToken) {
                        updateSharePreferences.mutate(newPrefs);
                      }
                    }}
                  />
                  <label htmlFor="share-dashboard" className="text-sm cursor-pointer">
                    Dashboard (stats & budget)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="share-history"
                    checked={sharePrefs.history}
                    onCheckedChange={(checked) => {
                      const newPrefs = { ...sharePrefs, history: !!checked };
                      setSharePrefs(newPrefs);
                      if (settings?.shareToken) {
                        updateSharePreferences.mutate(newPrefs);
                      }
                    }}
                  />
                  <label htmlFor="share-history" className="text-sm cursor-pointer">
                    Consumption History
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="share-inventory"
                    checked={sharePrefs.inventory}
                    onCheckedChange={(checked) => {
                      const newPrefs = { ...sharePrefs, inventory: !!checked };
                      setSharePrefs(newPrefs);
                      if (settings?.shareToken) {
                        updateSharePreferences.mutate(newPrefs);
                      }
                    }}
                  />
                  <label htmlFor="share-inventory" className="text-sm cursor-pointer">
                    Product Inventory
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="share-purchases"
                    checked={sharePrefs.purchases}
                    onCheckedChange={(checked) => {
                      const newPrefs = { ...sharePrefs, purchases: !!checked };
                      setSharePrefs(newPrefs);
                      if (settings?.shareToken) {
                        updateSharePreferences.mutate(newPrefs);
                      }
                    }}
                  />
                  <label htmlFor="share-purchases" className="text-sm cursor-pointer">
                    Purchase History
                  </label>
                </div>
              </div>
            </div>
            
            {settings?.shareToken || shareUrl ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={shareUrl || `${window.location.origin}/share/${settings?.shareToken}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl || `${window.location.origin}/share/${settings?.shareToken}`);
                      toast.success("Link copied to clipboard!");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(shareUrl || `/share/${settings?.shareToken}`, "_blank")}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Open Share Link
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => revokeShareToken.mutate()}
                    disabled={revokeShareToken.isPending}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => generateShareToken.mutate()}
                className="w-full"
                disabled={generateShareToken.isPending}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {generateShareToken.isPending ? "Generating..." : "Generate Share Link"}
              </Button>
            )}
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
