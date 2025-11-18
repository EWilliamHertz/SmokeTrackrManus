import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Package, Calendar, BarChart3, PieChart } from "lucide-react";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

export default function CostAnalytics() {
  const { user } = useAuth();
  const { data: products } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: purchases } = trpc.purchases.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: consumption } = trpc.consumption.list.useQuery(undefined, {
    enabled: !!user,
  });

  const analytics = useMemo(() => {
    if (!products || !purchases || !consumption) {
      return {
        totalSpent: 0,
        costPerDay: 0,
        costPerItem: 0,
        totalItems: 0,
        costByType: [],
        mostExpensiveProducts: [],
        monthlyCosts: [],
        avgPricePerUnit: 0,
      };
    }

    // Calculate total spent
    const totalSpent = purchases.reduce((sum, p) => sum + parseFloat(p.totalCost), 0);

    // Calculate total consumed items
    const totalItems = consumption.reduce((sum, c) => sum + parseFloat(c.quantity as any), 0);

    // Calculate cost per item (average cost per consumption)
    const productCostMap: Record<number, number> = {};
    products.forEach(product => {
      const productPurchases = purchases.filter(p => p.productId === product.id);
      const totalCost = productPurchases.reduce((sum, p) => sum + parseFloat(p.totalCost), 0);
      const totalQuantity = productPurchases.reduce((sum, p) => sum + p.quantity, 0);
      productCostMap[product.id] = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    });

    const totalConsumedCost = consumption.reduce((sum, c) => {
      const costPerUnit = productCostMap[c.productId] || 0;
      return sum + (costPerUnit * parseFloat(c.quantity as any));
    }, 0);

    const costPerItem = totalItems > 0 ? totalConsumedCost / totalItems : 0;

    // Calculate cost per day
    let costPerDay = 0;
    if (consumption.length > 0) {
      const sortedConsumption = [...consumption].sort(
        (a, b) => new Date(a.consumptionDate).getTime() - new Date(b.consumptionDate).getTime()
      );
      const firstDate = new Date(sortedConsumption[0].consumptionDate);
      const lastDate = new Date(sortedConsumption[sortedConsumption.length - 1].consumptionDate);
      const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
      costPerDay = totalConsumedCost / daysDiff;
    }

    // Cost breakdown by product type
    const costByTypeMap: Record<string, number> = {};
    consumption.forEach(c => {
      const product = products.find(p => p.id === c.productId);
      if (product) {
        const type = product.type;
        const costPerUnit = productCostMap[c.productId] || 0;
        const cost = costPerUnit * parseFloat(c.quantity as any);
        costByTypeMap[type] = (costByTypeMap[type] || 0) + cost;
      }
    });

    const costByType = Object.entries(costByTypeMap).map(([type, cost]) => ({
      type,
      cost: Math.round(cost * 100) / 100,
    }));

    // Most expensive products by total consumed cost
    const productTotalCost: Record<number, { name: string; cost: number; quantity: number }> = {};
    consumption.forEach(c => {
      const product = products.find(p => p.id === c.productId);
      if (product) {
        const costPerUnit = productCostMap[c.productId] || 0;
        const cost = costPerUnit * parseFloat(c.quantity as any);
        const quantity = parseFloat(c.quantity as any);
        
        if (!productTotalCost[c.productId]) {
          productTotalCost[c.productId] = { name: product.name, cost: 0, quantity: 0 };
        }
        productTotalCost[c.productId].cost += cost;
        productTotalCost[c.productId].quantity += quantity;
      }
    });

    const mostExpensiveProducts = Object.values(productTotalCost)
      .map(p => ({
        ...p,
        cost: Math.round(p.cost * 100) / 100,
        avgCost: Math.round((p.cost / p.quantity) * 100) / 100,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Monthly costs (last 6 months)
    const monthlyMap: Record<string, number> = {};
    consumption.forEach(c => {
      const date = new Date(c.consumptionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const costPerUnit = productCostMap[c.productId] || 0;
      const cost = costPerUnit * parseFloat(c.quantity as any);
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + cost;
    });

    const monthlyCosts = Object.entries(monthlyMap)
      .map(([month, cost]) => ({
        month,
        cost: Math.round(cost * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    // Average price per unit across all products
    const avgPricePerUnit = totalItems > 0 ? totalConsumedCost / totalItems : 0;

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalConsumedCost: Math.round(totalConsumedCost * 100) / 100,
      costPerDay: Math.round(costPerDay * 100) / 100,
      costPerItem: Math.round(costPerItem * 100) / 100,
      totalItems: Math.round(totalItems * 100) / 100,
      costByType,
      mostExpensiveProducts,
      monthlyCosts,
      avgPricePerUnit: Math.round(avgPricePerUnit * 100) / 100,
    };
  }, [products, purchases, consumption]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Cost Analytics</h1>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Total Consumed Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalConsumedCost?.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-muted-foreground">SEK</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Cost Per Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.costPerDay.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">SEK/day</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-600/10 border-orange-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Package className="w-3 h-3" />
                Cost Per Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.costPerItem.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">SEK/item</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalItems.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">consumed</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Cost Trends */}
        {analytics.monthlyCosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Cost Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.monthlyCosts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" name="Cost (SEK)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cost by Product Type */}
        {analytics.costByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Cost Breakdown by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.costByType}
                      dataKey="cost"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.type}: ${entry.cost.toFixed(0)} SEK`}
                    >
                      {analytics.costByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analytics.costByType.map((item, index) => (
                    <div key={item.type} className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.type}</span>
                      </div>
                      <span className="font-bold">{item.cost.toFixed(2)} SEK</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Most Expensive Products */}
        {analytics.mostExpensiveProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Most Expensive Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.mostExpensiveProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.quantity.toFixed(1)} items • {product.avgCost.toFixed(2)} SEK/item
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{product.cost.toFixed(2)} SEK</div>
                      <div className="text-xs text-muted-foreground">Total spent</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {analytics.totalItems === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No consumption data yet</p>
            <p className="text-sm">Start logging consumption to see cost analytics</p>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
