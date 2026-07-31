import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Receipt, AlertTriangle, Calendar, RefreshCw, Loader2, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/utils/currency";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Bill {
  title: string;
  averageAmount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  occurrences: number;
  lastDate: string;
  nextExpectedDate: string;
  category: string;
  confidence: number;
  isUnused: boolean;
  daysSinceLast: number;
}

const Bills = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth?mode=signin");
      else setUser(session.user);
    });
  }, [navigate]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["bills", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("detect-bills");
      if (error) {
        toast.error("Failed to detect bills");
        throw error;
      }
      return data as { bills: Bill[]; totalMonthly: number };
    },
  });

  if (!user) return null;

  const bills = data?.bills || [];
  const active = bills.filter(b => !b.isUnused);
  const unused = bills.filter(b => b.isUnused);
  const upcoming = active
    .filter(b => {
      const days = Math.ceil((new Date(b.nextExpectedDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    })
    .sort((a, b) => new Date(a.nextExpectedDate).getTime() - new Date(b.nextExpectedDate).getTime());

  return (
    <div className="min-h-screen bg-background dark:bg-transparent">
      <header className="border-b glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Bills & Subscriptions</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Re-scan
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-hero text-white border-0">
                  <CardHeader className="pb-2"><CardTitle className="text-sm opacity-90">Monthly Recurring</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(data?.totalMonthly || 0)}</div>
                    <p className="text-xs opacity-80 mt-1">{active.length} active subscriptions</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Upcoming (7 days)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{upcoming.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(upcoming.reduce((s, b) => s + b.averageAmount, 0))} due</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-warning/40">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Possibly Unused</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-warning">{unused.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Review and cancel to save</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Due Soon</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {upcoming.map((b, i) => {
                    const days = Math.ceil((new Date(b.nextExpectedDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-shadow">
                        <div>
                          <div className="font-semibold">{b.title}</div>
                          <div className="text-xs text-muted-foreground">{b.category} • {b.frequency}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(b.averageAmount)}</div>
                          <Badge variant={days <= 2 ? "destructive" : "secondary"} className="text-xs mt-1">
                            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Unused */}
            {unused.length > 0 && (
              <Card className="border-warning/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <TrendingDown className="h-5 w-5" />Possibly Unused — Cancel to Save
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unused.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-warning/30 bg-warning/5">
                      <div>
                        <div className="font-semibold">{b.title}</div>
                        <div className="text-xs text-muted-foreground">Last charged {b.daysSinceLast} days ago • Expected every {b.frequency.replace('ly', '')}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-warning">{formatCurrency(b.averageAmount)}</div>
                        <div className="text-xs text-muted-foreground">{b.frequency}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* All active */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" />All Recurring Charges</CardTitle></CardHeader>
              <CardContent>
                {active.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No recurring charges detected yet. Add more transactions and re-scan.</p>
                ) : (
                  <div className="space-y-2">
                    {active.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium">{b.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{b.category}</span>
                            <span>•</span>
                            <span>{b.occurrences} charges</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">{b.confidence}% match</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(b.averageAmount)}</div>
                          <div className="text-xs text-muted-foreground capitalize">{b.frequency}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Bills;
