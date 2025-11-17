import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Package, TrendingUp, ShoppingCart, Archive, Gift } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
  const { data: giveaways } = trpc.giveaways.list.useQuery(undefined, {
    enabled: !!user,
  });

  const [giveawayDialogOpen, setGiveawayDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [giveawayQuantity, setGiveawayQuantity] = useState("");
  const [giveawayRecipient, setGiveawayRecipient] = useState("");
  const [giveawayNotes, setGiveawayNotes] = useState("");

  const utils = trpc.useUtils();
  const createGiveaway = trpc.giveaways.create.useMutation({
    onSuccess: () => {
      utils.giveaways.list.invalidate();
      toast.success("Giveaway recorded successfully");
      setGiveawayDialogOpen(false);
      setGiveawayQuantity("");
      setGiveawayRecipient("");
      setGiveawayNotes("");
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(`Failed to record giveaway: ${error.message}`);
    },
  });

  // Calculate inventory statistics for each product
  const inventoryStats = useMemo(() => {
    if (!products || !purchases || !consumption) return [];

    return products.map((product) => {
      const productPurchases = purchases.filter((p) => p.productId === product.id);
      const productConsumption = consumption.filter((c) => c.productId === product.id);
      const productGiveaways = giveaways?.filter((g) => g.productId === product.id) || [];

      const totalPurchased = productPurchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalConsumed = productConsumption.reduce(
        (sum, c) => sum + parseFloat(c.quantity),
        0
      );
      const totalGivenAway = productGiveaways.reduce(
        (sum, g) => sum + parseFloat(g.quantity),
        0
      );
      const stock = Math.round((totalPurchased - totalConsumed - totalGivenAway) * 100) / 100;

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

      // Calculate average price per unit from purchases
      const totalCost = productPurchases.reduce((sum, p) => sum + parseFloat(p.totalCost), 0);
      const avgPricePerUnit = totalPurchased > 0 ? totalCost / totalPurchased : 0;
      const inventoryValue = Math.round(stock * avgPricePerUnit * 100) / 100;
      const consumedValue = Math.round(totalConsumed * avgPricePerUnit * 100) / 100;

      return {
        ...product,
        stock,
        totalPurchased,
        totalConsumed,
        totalGivenAway,
        avgPerDay,
        avgPricePerUnit,
        inventoryValue,
        consumedValue,
      };
    });
  }, [products, purchases, consumption, giveaways]);

  const handleGiveaway = (productId: number) => {
    setSelectedProduct(productId);
    setGiveawayDialogOpen(true);
  };

  const handleSubmitGiveaway = () => {
    if (!selectedProduct || !giveawayQuantity) {
      toast.error("Please fill in required fields");
      return;
    }

    const quantity = parseFloat(giveawayQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const product = inventoryStats?.find((p) => p.id === selectedProduct);
    if (product && quantity > product.stock) {
      toast.error(`Cannot give away more than available stock (${product.stock})`);
      return;
    }

    createGiveaway.mutate({
      productId: selectedProduct,
      quantity,
      giveawayDate: new Date().toISOString(),
      recipient: giveawayRecipient || undefined,
      notes: giveawayNotes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Inventory</h1>
      </header>

      <main className="p-4 space-y-3 max-w-lg mx-auto">
        {/* Total Value Summary */}
        {inventoryStats && inventoryStats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Inventory Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventoryStats.reduce((sum, p) => sum + (p.inventoryValue || 0), 0).toFixed(2)} SEK
                </div>
                <div className="text-xs text-muted-foreground mt-1">Current stock worth</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Consumed Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventoryStats.reduce((sum, p) => sum + (p.consumedValue || 0), 0).toFixed(2)} SEK
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total spent on consumption</div>
              </CardContent>
            </Card>
          </div>
        )}

        {inventoryStats?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products yet</p>
            <p className="text-sm">Add a purchase to get started</p>
          </div>
        ) : (
          inventoryStats?.map((product) => (
            <Card key={product.id} className="hover:bg-accent/50 transition-colors">
              <Link href={`/product/${product.id}`}>
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
                  {product.totalGivenAway > 0 && (
                    <div className="text-xs text-muted-foreground text-center">
                      <Gift className="w-3 h-3 inline mr-1" />
                      {product.totalGivenAway.toFixed(1)} given away
                    </div>
                  )}
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
                  {product.inventoryValue > 0 && (
                    <div className="text-xs font-semibold text-green-600 dark:text-green-400 text-center pt-2 border-t">
                      Stock Value: {product.inventoryValue.toFixed(2)} SEK
                      <span className="text-muted-foreground font-normal ml-2">
                        ({product.avgPricePerUnit.toFixed(2)} SEK/unit)
                      </span>
                    </div>
                  )}
                </CardContent>
              </Link>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    handleGiveaway(product.id);
                  }}
                  disabled={product.stock <= 0}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Give Away
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Give Away Dialog */}
      <Dialog open={giveawayDialogOpen} onOpenChange={setGiveawayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give Away Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                value={inventoryStats?.find((p) => p.id === selectedProduct)?.name || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="e.g., 1 or 0.5"
                value={giveawayQuantity}
                onChange={(e) => setGiveawayQuantity(e.target.value)}
              />
              {selectedProduct && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {inventoryStats?.find((p) => p.id === selectedProduct)?.stock || 0}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="recipient">Recipient (optional)</Label>
              <Input
                id="recipient"
                placeholder="e.g., John Doe"
                value={giveawayRecipient}
                onChange={(e) => setGiveawayRecipient(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="e.g., Birthday gift"
                value={giveawayNotes}
                onChange={(e) => setGiveawayNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setGiveawayDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitGiveaway}
                disabled={createGiveaway.isPending}
              >
                {createGiveaway.isPending ? "Recording..." : "Record Giveaway"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
