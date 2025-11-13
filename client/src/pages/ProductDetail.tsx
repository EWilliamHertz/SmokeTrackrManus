import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";

export default function ProductDetail() {
  const { user } = useAuth();
  const params = useParams();
  const productId = parseInt(params.id || "0");

  const { data: products } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const { data: inventory } = trpc.products.inventory.useQuery(
    { productId },
    { enabled: !!user && productId > 0 }
  );

  const product = products?.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{product.name}</h1>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{product.type}</span>
            </div>
            {product.flavorDetail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flavor</span>
                <span className="font-medium">{product.flavorDetail}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {inventory && (
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Purchased</span>
                <span className="font-medium">{inventory.totalPurchased}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Consumed</span>
                <span className="font-medium">{inventory.totalConsumed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stock</span>
                <span className="font-bold text-lg">{inventory.currentStock}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Avg Cost Per Item</span>
                <span className="font-medium">{inventory.avgCost.toFixed(2)} SEK</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
