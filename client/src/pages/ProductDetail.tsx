import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Link, useParams } from "wouter";

export default function ProductDetail() {
  const { user } = useAuth();
  const params = useParams();
  const productId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"Cigar" | "Cigarillo" | "Cigarette" | "Snus" | "Other">("Cigar");
  const [editFlavor, setEditFlavor] = useState("");

  const utils = trpc.useUtils();
  
  const { data: products } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Product updated!");
      setEditOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
  
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Product deleted!");
      setLocation("/inventory");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
  
  const handleEditOpen = () => {
    if (product) {
      setEditName(product.name);
      setEditType(product.type as any);
      setEditFlavor(product.flavorDetail || "");
      setEditOpen(true);
    }
  };
  
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate({
      id: productId,
      name: editName,
      type: editType,
      flavorDetail: editFlavor || undefined,
    });
  };
  
  const handleDelete = () => {
    deleteProduct.mutate({ id: productId });
  };
  
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
      <header className="bg-card border-b border-border px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleEditOpen}>
                <Edit className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
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
                  <Input value={editFlavor} onChange={(e) => setEditFlavor(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={updateProduct.isPending}>
                  {updateProduct.isPending ? "Updating..." : "Update Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Product</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{product.name}"? This will also delete all associated purchases and consumption records. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteProduct.isPending}>
                  {deleteProduct.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
