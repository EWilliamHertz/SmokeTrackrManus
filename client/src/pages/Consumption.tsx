import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Consumption() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

  const { data: products } = trpc.products.list.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();
  const createConsumption = trpc.consumption.create.useMutation({
    onSuccess: () => {
      utils.dashboard.stats.invalidate();
      utils.consumption.list.invalidate();
      toast.success("Consumption logged!");
      setLocation("/");
    },
    onError: (error) => {
      toast.error("Failed to log consumption: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error("Please select a product");
      return;
    }

    createConsumption.mutate({
      productId: parseInt(productId),
      quantity: parseFloat(quantity),
      consumptionDate: new Date(date),
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Log Consumption</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add New Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} ({product.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex gap-2 mb-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setQuantity("0.3")} className="flex-1">0.3</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setQuantity("0.5")} className="flex-1">0.5</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setQuantity("1")} className="flex-1">1</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setQuantity("2")} className="flex-1">2</Button>
                </div>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createConsumption.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                {createConsumption.isPending ? "Logging..." : "Log Consumption"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
