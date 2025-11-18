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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Calendar, TrendingUp, Pencil, Trash2, BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ConsumptionHeatmap from "@/components/ConsumptionHeatmap";

type Period = "day" | "week" | "month" | "all";

export default function History() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("all");
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editProductId, setEditProductId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [chartView, setChartView] = useState<"daily" | "weekly">("daily");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 20;

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
      toast.error(`Failed to update: ${error.message}`);
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
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const productMap = useMemo(() => {
    if (!products) return {};
    return Object.fromEntries(products.map((p) => [p.id, p]));
  }, [products]);

  const purchasesByProduct = useMemo(() => {
    if (!purchases) return {};
    const map: Record<number, number> = {};
    for (const p of purchases) {
      map[p.productId] = (map[p.productId] || 0) + p.quantity;
    }
    return map;
  }, [purchases]);

  const filteredConsumption = useMemo(() => {
    if (!consumption) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return consumption.filter((c) => {
      const date = new Date(c.consumptionDate);
      if (period === "day") return date >= today;
      if (period === "week") return date >= weekAgo;
      if (period === "month") return date >= monthAgo;
      return true;
    });
  }, [consumption, period]);

  // Chart data calculation
  const chartData = useMemo(() => {
    if (!filteredConsumption || filteredConsumption.length === 0) return [];

    if (chartView === "daily") {
      // Group by day
      const byDay: Record<string, number> = {};
      filteredConsumption.forEach((c) => {
        const date = new Date(c.consumptionDate);
        const key = date.toISOString().split('T')[0];
        byDay[key] = (byDay[key] || 0) + parseFloat(c.quantity as any);
      });

      return Object.entries(byDay)
        .map(([date, quantity]) => ({
          date: new Date(date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
          quantity: Number(quantity.toFixed(2)),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30); // Last 30 days
    } else {
      // Group by week
      const byWeek: Record<string, number> = {};
      filteredConsumption.forEach((c) => {
        const date = new Date(c.consumptionDate);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split('T')[0];
        byWeek[key] = (byWeek[key] || 0) + parseFloat(c.quantity as any);
      });

      return Object.entries(byWeek)
        .map(([date, quantity]) => ({
          date: `Week of ${new Date(date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}`,
          quantity: Number(quantity.toFixed(2)),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-12); // Last 12 weeks
    }
  }, [filteredConsumption, chartView]);

  const byProduct = useMemo(() => {
    const map: Record<number, number> = {};
    for (const c of filteredConsumption) {
      map[c.productId] = (map[c.productId] || 0) + parseFloat(c.quantity as any);
    }
    return map;
  }, [filteredConsumption]);

  const totalItems = useMemo(
    () => filteredConsumption.reduce((sum, c) => sum + parseFloat(c.quantity as any), 0),
    [filteredConsumption]
  );

  const totalCost = useMemo(() => {
    if (!purchases) return 0;
    return filteredConsumption.reduce((sum, c) => {
      const product = productMap[c.productId];
      if (!product) return sum;
      const productPurchases = purchases.filter((p) => p.productId === c.productId);
      if (productPurchases.length === 0) return sum;
      const avgCost =
        productPurchases.reduce((s, p) => s + parseFloat(p.totalCost), 0) /
        productPurchases.reduce((s, p) => s + p.quantity, 0);
      return sum + avgCost * parseFloat(c.quantity as any);
    }, 0);
  }, [filteredConsumption, purchases, productMap]);

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditQuantity(entry.quantity.toString());
    setEditProductId(entry.productId.toString());
    // Format datetime-local input value (YYYY-MM-DDTHH:MM) in local timezone
    const date = new Date(entry.consumptionDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setEditDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const handleUpdate = () => {
    if (!editingEntry) return;
    updateConsumption.mutate({
      id: editingEntry.id,
      quantity: parseFloat(editQuantity),
      productId: parseInt(editProductId),
      consumptionDate: new Date(editDate),
    });
  };

  const handleDelete = (id: number) => {
    deleteConsumption.mutate({ id });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view history</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-8 w-8" />
          <h1 className="text-3xl font-bold">History & Analytics</h1>
        </div>

        <div className="mb-6">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Consumption Trends Chart */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Consumption Trends</CardTitle>
              </div>
              <Tabs value={chartView} onValueChange={(v) => setChartView(v as "daily" | "weekly")}>
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="quantity" fill="hsl(var(--primary))" name="Consumed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No consumption data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consumption Heatmap */}
        {consumption && consumption.length > 0 && (
          <ConsumptionHeatmap consumption={consumption} />
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalItems.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalCost.toFixed(2)} SEK</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Consumption by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(byProduct)
                .sort(([, a], [, b]) => b - a)
                .map(([productId, quantity]) => {
                  const product = productMap[Number(productId)];
                  if (!product) return null;
                  return (
                    <div key={productId} className="flex justify-between items-center">
                      <span>{product.name}</span>
                      <span className="font-semibold">{quantity.toFixed(1)}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const sorted = filteredConsumption.sort((a, b) => new Date(b.consumptionDate).getTime() - new Date(a.consumptionDate).getTime());
                const totalPages = Math.ceil(sorted.length / entriesPerPage);
                const startIndex = (currentPage - 1) * entriesPerPage;
                const paginatedEntries = sorted.slice(startIndex, startIndex + entriesPerPage);
                return paginatedEntries.map((entry) => {
                  const product = productMap[entry.productId];
                  if (!product) return null;
                  return (
                    <div key={entry.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.consumptionDate).toLocaleDateString()} {new Date(entry.consumptionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {parseFloat(entry.quantity as any).toFixed(1)} consumed
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                });
              })()}
              
              {(() => {
                const sorted = filteredConsumption.sort((a, b) => new Date(b.consumptionDate).getTime() - new Date(a.consumptionDate).getTime());
                const totalPages = Math.ceil(sorted.length / entriesPerPage);
                if (totalPages <= 1) return null;
                return (
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNav />

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Consumption</DialogTitle>
            <DialogDescription>Update the consumption details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={editProductId} onValueChange={setEditProductId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
              />
            </div>
            <div>
              <Label>Date & Time</Label>
              <Input
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
              {updateConsumption.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Consumption</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this consumption entry? This action cannot be undone.
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
    </div>
  );
}
