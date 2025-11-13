import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useRoute } from "wouter";

export default function ShareView() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token || "";

  const { data: stats, isLoading, error } = trpc.share.getPublicStats.useQuery(
    { token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Share Link</h1>
          <p className="text-muted-foreground">This link is invalid or has been revoked.</p>
        </div>
      </div>
    );
  }

  const budgetPercentage = (stats.monthlySpent / stats.monthlyBudget) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground">SmokeTrackr</h1>
        <p className="text-sm text-muted-foreground">Public Consumption Stats</p>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Consumed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConsumed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cigars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCigars}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cigarillos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCigarillos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cigarettes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCigarettes}</div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Snus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSnus}</div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>This is a read-only view of consumption statistics.</p>
          <p className="mt-2">Powered by SmokeTrackr</p>
        </div>
      </main>
    </div>
  );
}
