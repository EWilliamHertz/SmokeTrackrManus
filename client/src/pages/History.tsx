import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Period = "day" | "week" | "month" | "all";

export default function History() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("all");
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editProductId, setEditProductId] = useState("");
  const [editDate, setEditDate] = useState("");

  const { data: consumption } = trpc.consumption.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: products } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: purchases } = trpc.purchases.list.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();

  const updateConsumption = trpc.consumption.update.useMutation({
    onSuccess: () => {
      utils.consumption.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Consumption updated!");
      setEditingEntry(null);
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const deleteConsumption = trpc.consumption.delete.useMutation({
    onSuccess: () => {
      utils.consumption.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Consumption deleted!");
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditQuantity(entry.quantity);
    setEditProductId(entry.productId.toString());
    setEditDate(new Date(entry.consumptionDate).toISOString().slice(0, 16));
  };

  const handleUpdate = () => {
    if (!editingEntry) return;
    updateConsumption.mutate({
      id: editingEntry.id,
      productId: parseInt(editProductId),
      quantity: parseFloat(editQuantity),
      consumptionDate: new Date(editDate),
    });
  };

  const handleDelete = (id: number) => {
    deleteConsumption.mutate({ id });
  };

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!consumption || !products || !purchases) {
      return {
        totalItems: 0,
        totalCost: 0,
        byProduct: [],
        byType: {},
        dominantProduct: null,
        filteredConsumption: [],
      };
    }

    // Filter by period
    const now = new Date();
    const filteredConsumption = consumption.filter((c) => {
      const date = new Date(c.consumptionDate);
      if (period === "all") return true;
      if (period === "day") {
        return date.toDateString() === now.toDateString();
      }
      if (period === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      }
      if (period === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      }
      return true;
    });

    // Build product map
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build purchase map for pricing
    const priceMap = new Map<number, number>();
    for (const purchase of purchases) {
      if (!priceMap.has(purchase.productId)) {
        priceMap.set(purchase.productId, parseFloat(purchase.pricePerItem));
      }
    }

    // Calculate totals
    let totalItems = 0;
    let totalCost = 0;
    const productStats = new Map<number, { name: string; type: string; quantity: number; cost: number }>();
    const typeStats = new Map<string, number>();

    for (const c of filteredConsumption) {
      const product = productMap.get(c.productId);
      const price = priceMap.get(c.productId) || 0;
      const qty = parseFloat(c.quantity);
      const cost = qty * price;

      totalItems += qty;
      totalCost += cost;

      // By product
      const existing = productStats.get(c.productId);
      if (existing) {
        existing.quantity += qty;
        existing.cost += cost;
      } else if (product) {
        productStats.set(c.productId, {
          name: product.name,
          type: product.type,
          quantity: qty,
          cost,
        });
      }

      // By type
      if (product) {
        typeStats.set(product.type, (typeStats.get(product.type) || 0) + qty);
      }
    }

    // Sort by quantity
    const byProduct = Array.from(productStats.values()).sort((a, b) => b.quantity - a.quantity);

    const dominantProduct = byProduct.length > 0 ? byProduct[0] : null;

    return {
      totalItems,
      totalCost,
      byProduct,
      byType: Object.fromEntries(typeStats),
      dominantProduct,
      filteredConsumption,
    };
  }, [consumption, products, purchases, period]);

  const periodLabels: Record<Period, string> = {
    day: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Consumption History</h1>
      </header>

      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Period Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Time Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {(["day", "week", "month", "all"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className="text-xs"
                >
                  {periodLabels[p]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{analytics.totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{analytics.totalCost.toFixed(2)} SEK</div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </CardContent>
          </Card>
        </div>

        {/* Dominant Product */}
        {analytics.dominantProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Most Consumed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{analytics.dominantProduct.name}</span>
                  <span className="text-sm text-muted-foreground">{analytics.dominantProduct.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{analytics.dominantProduct.quantity} units</span>
                  <span className="font-medium">{analytics.dominantProduct.cost.toFixed(2)} SEK</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {((analytics.dominantProduct.quantity / analytics.totalItems) * 100).toFixed(1)}% of total
                  consumption
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* By Product Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Consumption by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.byProduct.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No consumption data for this period</p>
              ) : (
                analytics.byProduct.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.quantity} units</div>
                      <div className="text-sm text-muted-foreground">{item.cost.toFixed(2)} SEK</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Consumption by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.byType).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No consumption data for this period</p>
              ) : (
                Object.entries(analytics.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm">{type}</span>
                    <span className="font-medium">{count} units</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Consumption Log with Edit/Delete */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.filteredConsumption.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No consumption logged yet</p>
              ) : (
                analytics.filteredConsumption
                  .slice()
                  .sort((a, b) => new Date(b.consumptionDate).getTime() - new Date(a.consumptionDate).getTime())
                  .slice(0, 20)
                  .map((c) => {
                    const product = products?.find((p) => p.id === c.productId);
                    return (
                      <div key={c.id} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0">
                        <div className="flex-1">
                          <div className="font-medium">{product?.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(c.consumptionDate).toLocaleString()} • {c.quantity} units
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(c)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(c.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Consumption Entry</DialogTitle>
            <DialogDescription>Update the quantity, product, or date for this entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product">Product</Label>
              <Select value={editProductId} onValueChange={setEditProductId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="0.1"
                step="0.1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date & Time</Label>
              <Input
                id="edit-date"
                type="datetime-local"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateConsumption.isPending}>
              {updateConsumption.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Consumption Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteConsumption.isPending}
            >
              {deleteConsumption.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
