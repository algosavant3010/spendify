import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import TimePeriodFilter from "@/components/analytics/TimePeriodFilter";
import { formatCurrency } from "@/utils/currency";
import { ChartTooltip, ChartSkeleton } from "./ChartPrimitives";
import { EmptyState } from "@/components/ui/empty-state";
import { PieChart as PieChartIcon } from "lucide-react";

interface SpendingChartProps {
  userId: string;
}

const SpendingChart = ({ userId }: SpendingChartProps) => {
  const { t } = useTranslation();
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
      <g style={{ filter: `drop-shadow(0 6px 16px ${fill}55)` }}>
        <text x={cx} y={cy - 14} textAnchor="middle" fill="hsl(var(--foreground))" className="font-display" style={{ fontSize: 22 }}>
          {payload.name}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(var(--foreground))" className="tabular" style={{ fontSize: 18, fontWeight: 500 }}>
          {formatCurrency(value)}
        </text>
        <text x={cx} y={cy + 32} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="tabular" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {`${(percent * 100).toFixed(1)}% of total`}
        </text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} innerRadius={outerRadius + 4} outerRadius={outerRadius + 10} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.35} />
      </g>
    );
  };

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["spending-chart", userId, timePeriod],
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
        .select("amount, categories(name, color)")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("date", startDate);

      const categoryTotals = transactions?.reduce((acc, t) => {
        const categoryName = t.categories?.name || "Uncategorized";
        const color = t.categories?.color || "#6366f1";
        if (!acc[categoryName]) acc[categoryName] = { name: categoryName, value: 0, color };
        acc[categoryName].value += Number(t.amount);
        return acc;
      }, {} as Record<string, { name: string; value: number; color: string }>);

      return Object.values(categoryTotals || {});
    },
  });

  const total = chartData?.reduce((sum, item) => sum + item.value, 0) || 0;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bento overflow-hidden">
        <CardHeader className="panel-head sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <div className="eyebrow mb-1.5">§ Allocation</div>
            <CardTitle className="panel-title sm:text-3xl">
              Spending by <span className="accent-italic">category</span>
            </CardTitle>
          </div>
          <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />
        </CardHeader>
        <CardContent className="panel-body">
          {isLoading ? (
            <ChartSkeleton height={360} />
          ) : chartData && chartData.length > 0 ? (
            <>
              <div className="mb-4 px-3 sm:px-4 py-3 surface flex items-baseline justify-between">
                <div>
                  <div className="eyebrow">Total spent</div>
                  <p className="font-display text-3xl sm:text-4xl tabular mt-1">{formatCurrency(total)}</p>
                </div>
                <div className="text-right">
                  <div className="eyebrow">Categories</div>
                  <p className="font-display text-2xl tabular mt-1">{chartData.length}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 55 : 75}
                    outerRadius={isMobile ? 85 : 115}
                    paddingAngle={2}
                    dataKey="value"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                    animationDuration={700}
                    animationEasing="ease-out"
                  >
                    {chartData?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                        className="cursor-pointer transition-opacity duration-200"
                        style={{
                          opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.35,
                          outline: "none",
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: isMobile ? '11px' : '12px', paddingTop: 8 }}
                    formatter={(value, entry: any, idx: number) => {
                      const percentage = ((entry.payload.value / total) * 100).toFixed(1);
                      return (
                        <span
                          className="cursor-pointer transition-colors hover:text-foreground"
                          style={{ color: activeIndex === undefined || activeIndex === idx ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                        >
                          {value} <span className="tabular text-muted-foreground">{percentage}%</span>
                        </span>
                      );
                    }}
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <EmptyState
              size="chart"
              icon={PieChartIcon}
              eyebrow="No allocation yet"
              title="An empty pie is still a pie"
              description="Record expenses for this period and the split across categories will draw itself here."
              className="mx-1 sm:mx-0"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SpendingChart;
