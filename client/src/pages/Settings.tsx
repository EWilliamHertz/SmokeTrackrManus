import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
  });
  
  const [monthlyBudget, setMonthlyBudget] = useState("");

  const utils = trpc.useUtils();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Settings updated!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      monthlyBudget: parseFloat(monthlyBudget),
      currency: "SEK",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (SEK)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={settings?.monthlyBudget || "500.00"}
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? "Saving..." : "Save Budget"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{user?.name || user?.email}</p>
            </div>
            <Button variant="destructive" onClick={() => logout()} className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
