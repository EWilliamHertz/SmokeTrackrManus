import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { PlusCircle, TrendingUp, TrendingDown, History as HistoryIcon, Calendar } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DateRange = "today" | "week" | "month" | "all";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("month");
  
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(
    { dateRange },
    { enabled: !!user }
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">SmokeTrackr</h1>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const budgetPercentage = (stats.monthlySpent / stats.monthlyBudget) * 100;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold text-foreground">SmokeTrackr</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Date Range Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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

        <div className="space-y-2">
          <Link href="/consumption">
            <Button className="w-full h-14 text-lg" size="lg">
              <PlusCircle className="w-6 h-6 mr-2" />
              Log Consumption
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline" className="w-full h-12" size="lg">
              <HistoryIcon className="w-5 h-5 mr-2" />
              View History & Analytics
            </Button>
          </Link>
        </div>

        {/* Consumption Insights */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Consumption Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{stats.totalConsumed}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {(() => {
                    const days = dateRange === "today" ? 1 : dateRange === "week" ? 7 : dateRange === "month" ? 30 : 365;
                    const avgPerDay = stats.totalConsumed / days;
                    return avgPerDay.toFixed(1);
                  })()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
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
      </main>

      <MobileNav />
    </div>
  );
}
