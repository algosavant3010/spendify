import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus, LineChart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/utils/currency";
import { motion } from "framer-motion";

interface SpendingTrendProps {
  userId: string;
}

const SpendingTrend = ({ userId }: SpendingTrendProps) => {
  const { data: trendData, isLoading } = useQuery({
    queryKey: ["spending-trend", userId],
    queryFn: async () => {
      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      const { data: currentMonth } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("date", currentMonthStart.toISOString().split("T")[0]);

      const { data: lastMonth } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("date", lastMonthStart.toISOString().split("T")[0])
        .lte("date", lastMonthEnd.toISOString().split("T")[0]);

      const currentTotal = currentMonth?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const lastTotal = lastMonth?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const difference = currentTotal - lastTotal;
      const percentageChange = lastTotal > 0 ? (difference / lastTotal) * 100 : 0;

      return {
        current: currentTotal,
        last: lastTotal,
        difference,
        percentageChange: Math.abs(percentageChange),
        trend: difference > 0 ? "up" : difference < 0 ? "down" : "same",
      };
    },
  });

  const getTrendIcon = () => {
    if (trendData?.trend === "up") return TrendingUp;
    if (trendData?.trend === "down") return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trendData?.trend === "up") return "text-destructive";
    if (trendData?.trend === "down") return "text-success";
    return "text-muted-foreground";
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className="bento overflow-hidden h-full">
      <CardHeader className="panel-head">
        <div className="eyebrow mb-1.5">§ Trend</div>
        <CardTitle className="panel-title">
          Spending <span className="accent-italic">trend</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-9 w-2/3 rounded-sm bg-muted/60 skeleton-shimmer" />
            <div className="h-3 w-1/3 rounded-sm bg-muted/40 skeleton-shimmer" />
            <div className="h-3 w-full rounded-sm bg-muted/30 skeleton-shimmer" />
          </div>
        ) : !trendData || (trendData.current === 0 && trendData.last === 0) ? (
          <EmptyState
            size="compact"
            icon={LineChart}
            eyebrow="No baseline"
            title="Nothing to compare"
            description="After a month of entries, this tile compares your pace against the last one."
          />
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-3xl sm:text-4xl tabular leading-none tracking-tight truncate">
                {formatCurrency(trendData?.current || 0)}
              </p>
              <p className="eyebrow mt-2">This month</p>
            </div>
            <div className={`flex items-center gap-1 ${getTrendColor()} shrink-0`}>
              <TrendIcon className="h-4 w-4" strokeWidth={2} />
              <span className="text-base font-semibold tabular">
                {trendData?.percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-border/60">
            <div className="flex justify-between items-center">
              <span className="eyebrow">Last month</span>
              <span className="text-sm font-medium tabular">{formatCurrency(trendData?.last || 0)}</span>
            </div>
          </div>
        </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendingTrend;
