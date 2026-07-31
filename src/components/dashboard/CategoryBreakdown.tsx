import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatCurrency } from "@/utils/currency";
import { motion } from "framer-motion";
import { PieChart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface CategoryBreakdownProps {
  userId: string;
}

const CategoryBreakdown = ({ userId }: CategoryBreakdownProps) => {
  const { data: categoryData, isLoading } = useQuery({
    queryKey: ["category-breakdown", userId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from("transactions")
        .select("amount, type, categories(name, color, icon)")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

      if (!data || data.length === 0) return [];

      const categoryTotals = data.reduce((acc: any, transaction: any) => {
        const categoryName = transaction.categories?.name || "Uncategorized";
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            total: 0,
            color: transaction.categories?.color || "#6366f1",
            icon: transaction.categories?.icon || "tag",
          };
        }
        acc[categoryName].total += Number(transaction.amount);
        return acc;
      }, {});

      const categories = Object.values(categoryTotals)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);

      const maxAmount = Math.max(...categories.map((c: any) => c.total));

      return categories.map((cat: any) => ({
        ...cat,
        percentage: (cat.total / maxAmount) * 100,
      }));
    },
  });

  return (
    <Card className="bento overflow-hidden">
      <CardHeader className="panel-head">
        <div className="eyebrow mb-1.5">§ Last 30 days</div>
        <CardTitle className="panel-title">
          Top <span className="accent-italic">categories</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="panel-body">
        {isLoading ? (
          <div className="space-y-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2.5">
                <div className="h-3 w-1/3 rounded-sm bg-muted/60 skeleton-shimmer" />
                <div className="h-1.5 w-full rounded-sm bg-muted/40 skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : !categoryData || categoryData.length === 0 ? (
          <EmptyState
            size="compact"
            icon={PieChart}
            eyebrow="No split yet"
            title="Where it goes"
            description="Once a few expenses land, your five largest categories rank here."
          />
        ) : (
          <div className="space-y-5">
            {categoryData.map((category: any, index: number) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07, duration: 0.4 }}
                className="space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="grid place-items-center h-7 w-7 rounded-sm shrink-0"
                      style={{ backgroundColor: `${category.color}1f`, color: category.color }}
                    >
                      <CategoryIcon iconName={category.icon} size={14} />
                    </div>
                    <span className="text-sm font-medium truncate">{category.name}</span>
                  </div>
                  <span className="text-sm tabular font-medium tracking-tight shrink-0">
                    {formatCurrency(category.total)}
                  </span>
                </div>
                <Progress
                  value={category.percentage}
                  className="h-1.5"
                  style={{ backgroundColor: `${category.color}1a` }}
                  indicatorClassName="transition-all duration-700"
                  {...{ style: { "--indicator-color": category.color } as any }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryBreakdown;
