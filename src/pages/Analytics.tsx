import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, Legend, Cell, Area, ComposedChart,
} from "recharts";
import { formatCurrency } from "@/utils/currency";
import { ChartTooltip, ChartSkeleton, chartCursor } from "@/components/dashboard/ChartPrimitives";

const axisStyle = {
  fontSize: 11,
  fontFamily: "var(--font-sans)",
  fill: "hsl(var(--muted-foreground))",
};

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=signin");
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate]);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*, categories(name)")
        .eq("user_id", user!.id)
        .order("date", { ascending: true });

      if (!transactions) return null;

      const dayOfWeekData = Array(7).fill(0).map((_, i) => ({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
        amount: 0,
        count: 0,
      }));

      const monthlyData: Record<string, { income: number; expense: number }> = {};

      transactions.forEach((t) => {
        const date = new Date(t.date);
        const dayOfWeek = date.getDay();
        if (t.type === "expense") {
          dayOfWeekData[dayOfWeek].amount += t.amount;
          dayOfWeekData[dayOfWeek].count += 1;
        }
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0 };
        monthlyData[monthKey][t.type] += t.amount;
      });

      const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        savings: data.income - data.expense,
      }));

      const topSpendingDays = dayOfWeekData
        .map(d => ({ ...d, avg: d.count > 0 ? d.amount / d.count : 0 }))
        .sort((a, b) => b.amount - a.amount);

      return { dayOfWeek: dayOfWeekData, monthlyTrend, topSpendingDays };
    },
  });

  if (!user) return null;

  const compact = (v: number) =>
    v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` :
    v >= 1e5 ? `₹${(v / 1e5).toFixed(1)}L` :
    v >= 1e3 ? `₹${(v / 1e3).toFixed(0)}K` : `₹${v}`;

  return (
    <div className="min-h-screen bg-background dark:bg-transparent">
      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm" className="group rounded-sm">
            <ArrowLeft className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            Back
          </Button>
          <div>
            <div className="eyebrow">§ Deep dive</div>
            <h1 className="font-display text-2xl sm:text-3xl leading-none">Analytics</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-5 sm:space-y-6">
        {/* Monthly Trend — area + line */}
        <Card className="bento overflow-hidden">
          <CardHeader className="pb-2">
            <div className="eyebrow mb-1.5">§ 01 · Cashflow</div>
            <CardTitle className="font-display text-2xl sm:text-3xl font-normal">
              Income vs <span className="accent-italic">Expense</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-4">
            {isLoading ? (
              <ChartSkeleton height={300} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData?.monthlyTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-expense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                  <XAxis dataKey="month" tick={axisStyle as any} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle as any} tickFormatter={compact} tickLine={false} axisLine={false} width={50} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--primary) / 0.25)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Area type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#g-income)" name="Income" activeDot={{ r: 5, strokeWidth: 2 }} animationDuration={800} />
                  <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#g-expense)" name="Expense" activeDot={{ r: 5, strokeWidth: 2 }} animationDuration={900} />
                  <Line type="monotone" dataKey="savings" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 4" name="Savings" dot={false} activeDot={{ r: 5 }} animationDuration={1000} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Day of Week — bar with hover highlight */}
        <Card className="bento overflow-hidden">
          <CardHeader className="pb-2">
            <div className="eyebrow mb-1.5">§ 02 · Rhythms</div>
            <CardTitle className="font-display text-2xl sm:text-3xl font-normal">
              Spending by <span className="accent-italic">day</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-4">
            {isLoading ? (
              <ChartSkeleton height={300} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.dayOfWeek || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                  <XAxis dataKey="day" tick={axisStyle as any} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle as any} tickFormatter={compact} tickLine={false} axisLine={false} width={50} />
                  <Tooltip content={<ChartTooltip />} cursor={chartCursor} />
                  <Bar
                    dataKey="amount"
                    name="Total spent"
                    radius={[6, 6, 0, 0]}
                    onMouseEnter={(_, i) => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    animationDuration={700}
                  >
                    {(analyticsData?.dayOfWeek || []).map((_, i) => (
                      <Cell
                        key={i}
                        fill="hsl(var(--primary))"
                        opacity={hoveredBar === null || hoveredBar === i ? 1 : 0.35}
                        style={{ transition: "opacity 200ms ease-out", cursor: "pointer" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Spending Days */}
        <Card className="bento overflow-hidden">
          <CardHeader className="pb-2">
            <div className="eyebrow mb-1.5">§ 03 · Patterns</div>
            <CardTitle className="font-display text-2xl sm:text-3xl font-normal">
              Your spending <span className="accent-italic">signature</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData?.topSpendingDays.slice(0, 3).map((day, index) => (
                <div
                  key={day.day}
                  className="flex items-center justify-between p-4 rounded-sm border border-border/60 bg-card transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md group cursor-default"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-display text-3xl text-muted-foreground tabular w-10 group-hover:text-primary transition-colors">
                      №{index + 1}
                    </div>
                    <div>
                      <div className="font-display text-xl">{day.day}</div>
                      <div className="eyebrow mt-0.5">{day.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl tabular">{formatCurrency(day.amount)}</div>
                    <div className="eyebrow mt-0.5">avg {formatCurrency(day.avg)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
