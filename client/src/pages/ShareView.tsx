import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Calendar, Package, ShoppingCart, History as HistoryIcon } from "lucide-react";
import { useRoute } from "wouter";
import { useState, useMemo } from "react";

type Tab = "dashboard" | "history" | "inventory" | "purchases";

export default function ShareView() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token || "";
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const { data: shareData, isLoading, error } = trpc.share.getPublicData.useQuery(
    { token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Share Link</h1>
          <p className="text-muted-foreground">This link is invalid or has been revoked.</p>
        </div>
      </div>
    );
  }

  const { stats, preferences, products, consumption, purchases } = shareData;
  const visibleTabs = preferences || { dashboard: true, history: true, inventory: true, purchases: true };
  
  // Calculate budget percentage
  const budgetPercentage = (stats.monthlySpent / stats.monthlyBudget) * 100;

  // Calculate analytics for history
  const analytics = useMemo(() => {
    if (!consumption || !products || !purchases) {
      return { totalItems: 0, totalCost: 0, byProduct: [], recentEntries: [] };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const priceMap = new Map<number, number>();
    for (const purchase of purchases) {
      if (!priceMap.has(purchase.productId)) {
        priceMap.set(purchase.productId, parseFloat(purchase.pricePerItem));
      }
    }

    let totalItems = 0;
    let totalCost = 0;
    const productStats = new Map<number, { name: string; type: string; quantity: number; cost: number }>();

    for (const c of consumption) {
      const product = productMap.get(c.productId);
      const price = priceMap.get(c.productId) || 0;
      const qty = parseFloat(c.quantity);
      const cost = qty * price;

      totalItems += qty;
      totalCost += cost;

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
    }

    const byProduct = Array.from(productStats.values()).sort((a, b) => b.quantity - a.quantity);
    const recentEntries = consumption
      .slice()
      .sort((a, b) => new Date(b.consumptionDate).getTime() - new Date(a.consumptionDate).getTime())
      .slice(0, 10);

    return { totalItems, totalCost, byProduct, recentEntries };
  }, [consumption, products, purchases]);

  // Calculate inventory
  const inventory = useMemo(() => {
    if (!products || !purchases || !consumption) return [];
    
    return products.map((product) => {
      const purchased = purchases
        .filter((p) => p.productId === product.id)
        .reduce((sum, p) => sum + p.quantity, 0);
      const consumed = consumption
        .filter((c) => c.productId === product.id)
        .reduce((sum, c) => sum + parseFloat(c.quantity), 0);
      
      return {
        ...product,
        stock: purchased - consumed,
      };
    });
  }, [products, purchases, consumption]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground">SmokeTrackr</h1>
        <p className="text-sm text-muted-foreground">Public Consumption Stats</p>
      </header>

      {/* Tab Navigation */}
      <div className="bg-card border-b border-border">
        <div className="flex overflow-x-auto max-w-2xl mx-auto">
          {visibleTabs.dashboard && (
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab("dashboard")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          )}
          {visibleTabs.history && (
            <Button
              variant={activeTab === "history" ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab("history")}
            >
              <HistoryIcon className="w-4 h-4 mr-2" />
              History
            </Button>
          )}
          {visibleTabs.inventory && (
            <Button
              variant={activeTab === "inventory" ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab("inventory")}
            >
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </Button>
          )}
          {visibleTabs.purchases && (
            <Button
              variant={activeTab === "purchases" ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab("purchases")}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchases
            </Button>
          )}
        </div>
      </div>

      <main className="p-4 space-y-4 max-w-2xl mx-auto pb-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && visibleTabs.dashboard && (
          <>
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Monthly Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-3xl font-bold">{stats.monthlySpent.toFixed(2)} SEK</span>
                  <span className="text-sm text-muted-foreground">of {stats.monthlyBudget.toFixed(2)} SEK</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      budgetPercentage > 90 ? 'bg-destructive' : 
                      budgetPercentage > 70 ? 'bg-yellow-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  {stats.remainingBudget > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">{stats.remainingBudget.toFixed(2)} SEK remaining</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      <span className="text-destructive">{Math.abs(stats.remainingBudget).toFixed(2)} SEK over budget</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Consumed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalConsumed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Cigars</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCigars}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Cigarillos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCigarillos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Cigarettes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCigarettes}</div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Snus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSnus}</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && visibleTabs.history && (
          <>
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

            <Card>
              <CardHeader>
                <CardTitle>Consumption by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.byProduct.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No consumption data</p>
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

            <Card>
              <CardHeader>
                <CardTitle>Recent Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.recentEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No consumption logged yet</p>
                  ) : (
                    analytics.recentEntries.map((c) => {
                      const product = products?.find((p) => p.id === c.productId);
                      return (
                        <div key={c.id} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0">
                          <div>
                            <div className="font-medium">{product?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(c.consumptionDate).toLocaleString()}
                            </div>
                          </div>
                          <div className="font-medium">{c.quantity} units</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && visibleTabs.inventory && (
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No products in inventory</p>
                ) : (
                  inventory.map((product) => (
                    <div key={product.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.type}
                          {product.flavorDetail && ` • ${product.flavorDetail}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{product.stock} in stock</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchases Tab */}
        {activeTab === "purchases" && visibleTabs.purchases && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!purchases || purchases.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No purchases recorded</p>
                ) : (
                  purchases
                    .slice()
                    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                    .map((purchase) => {
                      const product = products?.find((p) => p.id === purchase.productId);
                      return (
                        <div key={purchase.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                          <div className="flex-1">
                            <div className="font-medium">{product?.name || "Unknown Product"}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(purchase.purchaseDate).toLocaleDateString()} • {purchase.quantity} units
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{parseFloat(purchase.totalCost).toFixed(2)} SEK</div>
                            <div className="text-xs text-muted-foreground">
                              {parseFloat(purchase.pricePerItem).toFixed(2)} SEK each
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>This is a read-only view of consumption statistics.</p>
          <p className="mt-2">Powered by SmokeTrackr</p>
        </div>
      </main>
    </div>
  );
}
