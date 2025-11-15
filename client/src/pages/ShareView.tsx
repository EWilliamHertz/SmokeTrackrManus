import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Calendar, Package, ShoppingCart, History as HistoryIcon } from "lucide-react";
import { useRoute } from "wouter";
import { useState, useMemo, useEffect } from "react";

type Tab = "dashboard" | "history" | "inventory" | "purchases";

export default function ShareView() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token || "";

  const { data: shareData, isLoading, error } = trpc.share.getPublicData.useQuery(
    { token },
    { enabled: !!token }
  );

  // Initialize state with default tab
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Calculate all derived values with useMemo (must be before conditional returns)
  const visibleTabs = useMemo(() => {
    return shareData?.preferences || { dashboard: true, history: true, inventory: true, purchases: true };
  }, [shareData?.preferences]);

  const firstVisibleTab = useMemo(() => {
    return (
      visibleTabs.dashboard ? "dashboard" :
      visibleTabs.history ? "history" :
      visibleTabs.inventory ? "inventory" :
      visibleTabs.purchases ? "purchases" :
      "dashboard"
    ) as Tab;
  }, [visibleTabs]);

  const validActiveTab = useMemo(() => {
    return visibleTabs[activeTab] ? activeTab : firstVisibleTab;
  }, [activeTab, visibleTabs, firstVisibleTab]);

  const budgetPercentage = useMemo(() => {
    if (!shareData?.stats) return 0;
    return (shareData.stats.monthlySpent / shareData.stats.monthlyBudget) * 100;
  }, [shareData?.stats]);

  // Calculate analytics for history
  const analytics = useMemo(() => {
    if (!shareData?.consumption || !shareData?.products || !shareData?.purchases) {
      return { totalItems: 0, totalCost: 0, byProduct: [], recentEntries: [] };
    }

    const { consumption, products, purchases } = shareData;
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
  }, [shareData?.consumption, shareData?.products, shareData?.purchases]);

  // Calculate inventory
  const inventory = useMemo(() => {
    if (!shareData?.products || !shareData?.purchases || !shareData?.consumption) return [];
    
    const { products, purchases, consumption } = shareData;
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
  }, [shareData?.products, shareData?.purchases, shareData?.consumption]);

  // Update activeTab when firstVisibleTab changes
  useEffect(() => {
    setActiveTab(firstVisibleTab);
  }, [firstVisibleTab]);

  // NOW we can do conditional returns (after all hooks)
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

  const { stats, products } = shareData;

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
              variant={validActiveTab === "dashboard" ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab("dashboard")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          )}
          {visibleTabs.history && (
            <Button
              variant={validActiveTab === "history" ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab("history")}
            >
              <HistoryIcon className="w-4 h-4 mr-2" />
              History
            </Button>
          )}
          {visibleTabs.inventory && (
            <Button
              variant={validActiveTab === "inventory" ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => setActiveTab("inventory")}
            >
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </Button>
          )}
          {visibleTabs.purchases && (
            <Button
              variant={validActiveTab === "purchases" ? "default" : "ghost"}
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
        {validActiveTab === "dashboard" && visibleTabs.dashboard && (
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
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Total Consumed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalConsumed}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Cigars</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalCigars}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Cigarillos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalCigarillos}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Cigarettes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalCigarettes}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Snus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalSnus}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* History Tab */}
        {validActiveTab === "history" && visibleTabs.history && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{analytics.totalItems.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total Items</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{analytics.totalCost.toFixed(2)} SEK</p>
                    <p className="text-sm text-muted-foreground mt-1">Total Cost</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Consumption by Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.byProduct.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No consumption data</p>
                ) : (
                  analytics.byProduct.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.quantity.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">{item.cost.toFixed(2)} SEK</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Consumption</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.recentEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent entries</p>
                ) : (
                  analytics.recentEntries.map((entry, idx) => {
                    const product = products.find((p) => p.id === entry.productId);
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(entry.consumptionDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{product?.name}</p>
                          <p className="text-muted-foreground">Qty: {entry.quantity}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Inventory Tab */}
        {validActiveTab === "inventory" && visibleTabs.inventory && (
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No products</p>
              ) : (
                inventory.map((product) => (
                  <div key={product.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{product.stock}</p>
                      <p className="text-sm text-muted-foreground">in stock</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Purchases Tab */}
        {validActiveTab === "purchases" && visibleTabs.purchases && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!shareData.purchases || shareData.purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No purchases</p>
              ) : (
                shareData.purchases
                  .slice()
                  .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                  .slice(0, 20)
                  .map((purchase) => {
                    const product = products.find((p) => p.id === purchase.productId);
                    return (
                      <div key={purchase.id} className="border-b border-border pb-3 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium">{product?.name}</p>
                          <p className="font-semibold">{purchase.totalCost} SEK</p>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                          </div>
                          <span>Qty: {purchase.quantity} × {purchase.pricePerItem} SEK</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
