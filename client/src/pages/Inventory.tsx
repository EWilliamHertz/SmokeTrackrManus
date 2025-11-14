import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package, TrendingUp, ShoppingCart, Archive } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";

export default function Inventory() {
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

  // Calculate inventory statistics for each product
  const inventoryStats = useMemo(() => {
    if (!products || !purchases || !consumption) return [];

    return products.map((product) => {
      const productPurchases = purchases.filter((p) => p.productId === product.id);
      const productConsumption = consumption.filter((c) => c.productId === product.id);

      const totalPurchased = productPurchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalConsumed = productConsumption.reduce(
        (sum, c) => sum + parseFloat(c.quantity),
        0
      );
      const stock = totalPurchased - totalConsumed;

      // Calculate average consumption per day (if there's consumption data)
      let avgPerDay = 0;
      if (productConsumption.length > 0) {
        const sortedConsumption = [...productConsumption].sort(
          (a, b) => new Date(a.consumptionDate).getTime() - new Date(b.consumptionDate).getTime()
        );
        const firstDate = new Date(sortedConsumption[0].consumptionDate);
        const lastDate = new Date(sortedConsumption[sortedConsumption.length - 1].consumptionDate);
        const daysDiff = Math.max(
          1,
          Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        avgPerDay = totalConsumed / daysDiff;
      }

      return {
        ...product,
        stock,
        totalPurchased,
        totalConsumed,
        avgPerDay,
      };
    });
  }, [products, purchases, consumption]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Inventory</h1>
      </header>

      <main className="p-4 space-y-3 max-w-lg mx-auto">
        {inventoryStats?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products yet</p>
            <p className="text-sm">Add a purchase to get started</p>
          </div>
        ) : (
          inventoryStats?.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{product.type}</span>
                    {product.flavorDetail && (
                      <>
                        <span>•</span>
                        <span>{product.flavorDetail}</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col items-center p-2 bg-primary/10 rounded-lg">
                      <Archive className="w-4 h-4 mb-1 text-primary" />
                      <span className="font-semibold text-base">{product.stock}</span>
                      <span className="text-xs text-muted-foreground">In Stock</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-lg">
                      <ShoppingCart className="w-4 h-4 mb-1 text-blue-500" />
                      <span className="font-semibold text-base">{product.totalPurchased}</span>
                      <span className="text-xs text-muted-foreground">Purchased</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-orange-500/10 rounded-lg">
                      <TrendingUp className="w-4 h-4 mb-1 text-orange-500" />
                      <span className="font-semibold text-base">{product.totalConsumed.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">Consumed</span>
                    </div>
                  </div>
                  {product.avgPerDay > 0 && (
                    <div className="text-xs text-muted-foreground text-center pt-1">
                      Avg: {product.avgPerDay.toFixed(2)}/day
                      {product.stock > 0 && product.avgPerDay > 0 && (
                        <span className="ml-2">
                          • ~{Math.ceil(product.stock / product.avgPerDay)} days remaining
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </main>

      <MobileNav />
    </div>
  );
}
