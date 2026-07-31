import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Shield, Award } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/utils/currency";
import { EmptyState } from "@/components/ui/empty-state";


interface FinancialHealthScoreProps {
  userId: string;
}

const FinancialHealthScore = ({ userId }: FinancialHealthScoreProps) => {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ["financial-health", userId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type, date")
        .eq("user_id", userId)
        .gte("date", thirtyDaysAgo.toISOString());

      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", userId);

      if (!transactions || transactions.length === 0) {
        return { empty: true } as const;
      }

      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      const hasBudget = (budgets?.length || 0) > 0;
      const consistentTracking = transactions.length > 10;

      // Calculate health score (0-100)
      let score = 0;
      score += Math.min(savingsRate, 30); // Max 30 points for savings rate
      score += hasBudget ? 20 : 0; // 20 points for having budgets
      score += consistentTracking ? 20 : 0; // 20 points for consistent tracking
      score += expenses < income ? 30 : 0; // 30 points for spending less than earning

      return {
        empty: false as const,
        score: Math.round(score),
        savingsRate: Math.round(savingsRate),
        income,
        expenses,
        hasBudget,
        consistentTracking,
      };
    },
  });


  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  const rows = healthData && !healthData.empty
    ? [
        {
          label: "Savings rate",
          value: `${healthData.savingsRate}%`,
          icon: healthData.savingsRate > 20 ? TrendingUp : TrendingDown,
          tone: healthData.savingsRate > 20 ? "text-success" : "text-destructive",
        },
        { label: "Budget planning", value: healthData.hasBudget ? "Active" : "None" },
        { label: "Tracking consistency", value: healthData.consistentTracking ? "Good" : "Low" },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bento overflow-hidden">
        <CardHeader className="panel-head">
          <div className="eyebrow mb-1.5">§ Vitals</div>
          <CardTitle className="panel-title">
            Financial <span className="accent-italic">health</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="panel-body">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-14 w-24 mx-auto rounded-sm bg-muted/60 skeleton-shimmer" />
              <div className="h-1.5 w-full rounded-sm bg-muted/40 skeleton-shimmer" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 w-full rounded-sm bg-muted/40 skeleton-shimmer" />
              ))}
            </div>
          ) : !healthData || healthData.empty ? (
            <EmptyState
              size="compact"
              icon={Shield}
              eyebrow="Not scored yet"
              title="Awaiting a pulse"
              description="Log 30 days of income and expenses and we'll grade savings rate, budgeting and consistency."
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className={`metric text-6xl ${getScoreColor(healthData.score)}`}>
                    {healthData.score}
                  </div>
                  <div className="eyebrow mt-2.5">{getScoreLabel(healthData.score)}</div>
                </div>
                <div className="text-right">
                  <div className="eyebrow">Out of</div>
                  <div className="metric text-2xl mt-1.5 text-muted-foreground">100</div>
                </div>
              </div>

              <Progress value={healthData.score} className="h-1.5" />

              <div className="space-y-3">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className={`font-medium tabular flex items-center gap-1.5 ${r.tone ?? ""}`}>
                      {r.value}
                      {r.icon && <r.icon className="h-3.5 w-3.5" strokeWidth={2} />}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly income</span>
                  <span className="font-medium tabular text-success">
                    {formatCurrency(healthData.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly expenses</span>
                  <span className="font-medium tabular">
                    {formatCurrency(healthData.expenses)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};


export default FinancialHealthScore;
