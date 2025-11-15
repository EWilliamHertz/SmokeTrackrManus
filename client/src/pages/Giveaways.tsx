import { useAuth } from "@/_core/hooks/useAuth";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Gift, Calendar, User, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Giveaways() {
  const { user } = useAuth();
  const { data: giveaways, isLoading } = trpc.giveaways.list.useQuery(undefined, {
    enabled: !!user,
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Giveaway History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all products you've given away
        </p>
      </header>

      <main className="p-4 space-y-3 max-w-lg mx-auto">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Loading...</p>
          </div>
        ) : giveaways?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No giveaways recorded yet</p>
            <p className="text-sm mt-2">
              Use the "Give Away" button on the{" "}
              <Link href="/inventory" className="text-primary hover:underline">
                Inventory page
              </Link>{" "}
              to track items you give to others
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {giveaways?.map((giveaway) => (
              <Card key={giveaway.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{giveaway.productName}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(giveaway.giveawayDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-primary">
                        <Gift className="w-4 h-4" />
                        <span className="font-semibold">{giveaway.quantity}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">given away</span>
                    </div>
                  </div>

                  {(giveaway.recipient || giveaway.notes) && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      {giveaway.recipient && (
                        <div className="flex items-start gap-2 text-sm">
                          <User className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Recipient: </span>
                            <span className="text-foreground">{giveaway.recipient}</span>
                          </div>
                        </div>
                      )}
                      {giveaway.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Notes: </span>
                            <span className="text-foreground">{giveaway.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
