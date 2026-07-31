import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import TimePeriodFilter from "@/components/analytics/TimePeriodFilter";
import { formatCurrency } from "@/utils/currency";

interface StatsCardsProps {
  userId: string;
}

const StatsCards = ({ userId }: StatsCardsProps) => {
  const { t } = useTranslation();
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month');
  
  const { data: stats } = useQuery({
    queryKey: ["stats", userId, timePeriod],
    queryFn: async () => {
      const now = new Date();
      let startDate = '';
      
      if (timePeriod === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      } else if (timePeriod === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
      } else {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      }
      
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", userId)
        .gte("date", startDate);

      const income = transactions?.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const expenses = transactions?.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const balance = income - expenses;

      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", userId)
        .eq("period", "monthly");

      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

      return { income, expenses, balance, totalBudget, count: transactions?.length || 0 };
    },
  });

  const cards = [
    { title: t('totalBalance'), value: stats?.balance || 0, icon: Wallet, color: "text-primary", accent: "from-primary/15 to-primary/0" },
    { title: t('income'), value: stats?.income || 0, icon: TrendingUp, color: "text-success", accent: "from-success/15 to-success/0" },
    { title: t('expenses'), value: stats?.expenses || 0, icon: TrendingDown, color: "text-destructive", accent: "from-destructive/15 to-destructive/0" },
    { title: t('budget'), value: stats?.totalBudget || 0, icon: Target, color: "text-warning", accent: "from-warning/15 to-warning/0" },
  ];

  const isLoading = !stats;
  const isEmpty = !!stats && stats.count === 0 && stats.totalBudget === 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:justify-end">
        <div className="eyebrow sm:hidden">§ Overview</div>
        <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">

        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Card className="bento group p-4 sm:p-5 lg:p-6 h-full flex flex-col justify-between">
                <div className={`pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${card.accent} opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100`} />
                <div className="flex items-start justify-between gap-2 mb-3 sm:mb-5 relative">
                  <span className="eyebrow !text-[10px] leading-tight">{card.title}</span>
                  <Icon className={`h-4 w-4 shrink-0 ${card.color} transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110`} strokeWidth={1.5} />
                </div>

                {isLoading ? (
                  <div className="h-7 sm:h-9 w-24 max-w-full rounded-sm bg-muted/60 skeleton-shimmer" />
                ) : isEmpty ? (
                  <div className="metric text-[1.35rem] sm:text-3xl lg:text-4xl text-muted-foreground/45 select-none break-all">
                    {formatCurrency(0)}
                  </div>
                ) : (
                  <div className="metric text-[1.35rem] sm:text-3xl lg:text-4xl break-all">
                    {formatCurrency(card.value)}
                  </div>
                )}

                {isEmpty && (
                  <div className="mt-2 h-px w-8 bg-border" />
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
      {isEmpty && (
        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          No entries for this period yet — add a transaction and these figures fill in instantly.
        </p>
      )}
    </div>
  );
};

export default StatsCards;
