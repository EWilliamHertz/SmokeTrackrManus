import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package } from "lucide-react";
import { Link } from "wouter";

export default function Inventory() {
  const { user } = useAuth();
  const { data: products } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Inventory</h1>
      </header>

      <main className="p-4 space-y-3 max-w-lg mx-auto">
        {products?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products yet</p>
            <p className="text-sm">Add a purchase to get started</p>
          </div>
        ) : (
          products?.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{product.type}</span>
                    {product.flavorDetail && (
                      <span className="text-muted-foreground">{product.flavorDetail}</span>
                    )}
                  </div>
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
