import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Purchases() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState<"Cigar" | "Cigarillo" | "Cigarette" | "Snus" | "Other">("Cigar");
  const [flavorDetail, setFlavorDetail] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pricePerItem, setPricePerItem] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: products } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: purchases, isLoading: purchasesLoading } = trpc.purchases.list.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();
  const createProduct = trpc.products.create.useMutation();
  const createPurchase = trpc.purchases.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.purchases.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Purchase added!");
      setOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setProductName("");
    setFlavorDetail("");
    setQuantity("1");
    setPricePerItem("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let productId: number;
    const existingProduct = products?.find(p => p.name === productName);
    
    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      await createProduct.mutateAsync({
        name: productName,
        type: productType,
        flavorDetail: flavorDetail || undefined,
      });
      // Refetch products to get the new product ID
      const updatedProducts = await utils.products.list.fetch();
      const newProduct = updatedProducts.find(p => p.name === productName);
      if (!newProduct) throw new Error("Failed to create product");
      productId = newProduct.id;
    }

    createPurchase.mutate({
      productId,
      purchaseDate: new Date(purchaseDate),
      quantity: parseInt(quantity),
      pricePerItem: parseFloat(pricePerItem),
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Purchases</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Purchase</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={productType} onValueChange={(v: any) => setProductType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cigar">Cigar</SelectItem>
                    <SelectItem value="Cigarillo">Cigarillo</SelectItem>
                    <SelectItem value="Cigarette">Cigarette</SelectItem>
                    <SelectItem value="Snus">Snus</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Flavor/Detail (Optional)</Label>
                <Input value={flavorDetail} onChange={(e) => setFlavorDetail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Price Per Item (SEK)</Label>
                <Input type="number" step="0.01" min="0" value={pricePerItem} onChange={(e) => setPricePerItem(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={createPurchase.isPending}>
                {createPurchase.isPending ? "Adding..." : "Add Purchase"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            {purchasesLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : !purchases || purchases.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No purchases yet. Add one using the + button above
              </p>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium">{purchase.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.purchaseDate).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{purchase.quantity} units</p>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(purchase.pricePerItem).toFixed(2)} SEK each
                      </p>
                      <p className="text-sm font-medium">
                        {(purchase.quantity * parseFloat(purchase.pricePerItem)).toFixed(2)} SEK
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
