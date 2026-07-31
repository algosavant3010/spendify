import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currency";

interface BudgetOverviewProps {
  userId: string;
}

const BudgetOverview = ({ userId }: BudgetOverviewProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: budgets } = useQuery({
    queryKey: ["budgets", userId],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const { data } = await supabase
        .from("budgets")
        .select("*, categories(name, color)")
        .eq("user_id", userId)
        .eq("period", "monthly");

      if (!data) return [];

      const budgetsWithSpending = await Promise.all(
        data.map(async (budget) => {
          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("category_id", budget.category_id)
            .eq("type", "expense")
            .gte("date", `${currentMonth}-01`);

          const spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const percentage = (spent / Number(budget.amount)) * 100;
          
          return {
            ...budget,
            spent,
            percentage,
            isOverBudget: percentage > 100,
            isNearLimit: percentage >= Number(budget.alert_threshold) * 100,
          };
        })
      );

      return budgetsWithSpending;
    },
  });

  useEffect(() => {
    const budgetAlertsEnabled = localStorage.getItem('budgetAlerts') !== 'false';
    if (budgetAlertsEnabled && budgets) {
      budgets.forEach((budget) => {
        if (budget.isOverBudget) {
          toast.error(`Budget exceeded for ${budget.categories?.name}!`, {
            description: `You've spent ${formatCurrency(budget.spent)} of ${formatCurrency(Number(budget.amount))}`,
          });
        } else if (budget.isNearLimit) {
          toast.warning(`Approaching budget limit for ${budget.categories?.name}`, {
            description: `${budget.percentage.toFixed(0)}% of budget used`,
          });
        }
      });
    }
  }, [budgets]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bento overflow-hidden">
        <CardHeader className="panel-head">
          <div className="eyebrow mb-1.5">§ Limits</div>
          <CardTitle className="panel-title">
            Budget <span className="accent-italic">overview</span>
          </CardTitle>
        </CardHeader>
      <CardContent className="panel-body">
        <div className="space-y-5">
          {budgets?.map((budget) => (
            <div key={budget.id} className="space-y-2.5">
              <div className="flex justify-between items-center gap-3">
                <span className="text-sm font-medium truncate">{budget.categories?.name}</span>
                <span className="text-xs tabular text-muted-foreground shrink-0">
                  {formatCurrency(budget.spent)} / {formatCurrency(Number(budget.amount))}
                </span>
              </div>
              <div className="space-y-1.5">
                <Progress 
                  value={Math.min(budget.percentage, 100)} 
                  className="h-1.5"

                  indicatorClassName={
                    budget.isOverBudget ? "bg-destructive" : 
                    budget.isNearLimit ? "bg-warning" : 
                    "bg-success"
                  }
                />
                {budget.isNearLimit && (
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <AlertCircle className="h-3 w-3" />
                    <span>
                      {budget.isOverBudget ? "Over budget" : "Approaching limit"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!budgets || budgets.length === 0) && (
            <EmptyState
              size="compact"
              icon={Target}
              eyebrow="No limits set"
              title="Draw a line"
              description="Set a monthly cap per category and track it here as the month unfolds."
              action={
                <Button size="sm" variant="outline" className="rounded-sm" onClick={() => navigate("/budgets")}>
                  Create a budget
                </Button>
              }
            />
          )}

        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default BudgetOverview;
