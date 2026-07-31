import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, ArrowRight, ScrollText } from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EmptyState } from "@/components/ui/empty-state";

interface RecentTransactionsProps {
  userId: string;
}

const RowSkeleton = () => (
  <div className="panel-row">
    <div className="h-9 w-9 rounded-sm bg-muted/60 skeleton-shimmer shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-2/5 rounded-sm bg-muted/60 skeleton-shimmer" />
      <div className="h-2.5 w-1/4 rounded-sm bg-muted/40 skeleton-shimmer" />
    </div>
    <div className="h-3.5 w-16 rounded-sm bg-muted/60 skeleton-shimmer" />
  </div>
);

const RecentTransactions = ({ userId }: RecentTransactionsProps) => {
  const navigate = useNavigate();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["recent-transactions", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*, categories(name, color, icon)")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(10);

      return data ?? [];
    },
  });

  return (
    <Card className="bento overflow-hidden">
      <CardHeader className="panel-head">
        <div className="panel-head-row">
          <div>
            <div className="eyebrow mb-1.5">§ Ledger</div>
            <CardTitle className="panel-title">
              Recent <span className="accent-italic">entries</span>
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/transactions")}
            className="group shrink-0 -mt-1"
          >
            View all
            <ArrowRight className="h-4 w-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="panel-body">
        {isLoading ? (
          <div>
            {[...Array(4)].map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            eyebrow="Blank page"
            title="Nothing recorded yet"
            description="Your first entry starts the ledger. Add an expense or income and it will appear here, dated and categorised."
            action={
              <Button size="sm" className="rounded-sm" onClick={() => navigate("/transactions")}>
                Add your first entry
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            }
          />
        ) : (
          <div>
            {transactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="panel-row group -mx-2 px-2 rounded-sm hover:bg-muted/40"
              >
                <div
                  className="grid place-items-center h-9 w-9 rounded-sm shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: `${transaction.categories?.color ?? "#6366f1"}1f`,
                    color: transaction.categories?.color ?? "#6366f1",
                  }}
                >
                  <CategoryIcon iconName={transaction.categories?.icon || "tag"} size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate leading-snug">{transaction.title}</p>
                    {transaction.receipt_url && (
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mt-1 truncate">
                    {format(new Date(transaction.date), "dd MMM yyyy")}
                    {transaction.categories?.name ? ` · ${transaction.categories.name}` : ""}
                  </p>
                </div>

                <p
                  className={`text-sm font-medium tabular shrink-0 tracking-tight ${
                    transaction.type === "income" ? "text-success" : "text-foreground"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "−"}
                  {formatCurrency(Number(transaction.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
