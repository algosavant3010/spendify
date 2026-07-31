import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, RepeatIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import TransactionFilters, { TransactionFilterOptions } from "@/components/transactions/TransactionFilters";
import ReceiptPreviewDialog from "@/components/transactions/ReceiptPreviewDialog";
import { exportToCSV, exportToPDF } from "@/utils/exportData";
import { formatCurrency } from "@/utils/currency";
import { CategoryIcon } from "@/components/CategoryIcon";

const Transactions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; title: string } | null>(null);
  const [filters, setFilters] = useState<TransactionFilterOptions>({
    type: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

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

  const { data: categories } = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["all-transactions", user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*, categories(name, color, icon)")
        .eq("user_id", user!.id);

      if (filters.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }

      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters.startDate) {
        query = query.gte("date", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("date", filters.endDate);
      }

      if (filters.minAmount !== undefined) {
        query = query.gte("amount", filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        query = query.lte("amount", filters.maxAmount);
      }

      query = query.order(filters.sortBy, { ascending: filters.sortOrder === "asc" });

      const { data } = await query;
      return data || [];
    },
    enabled: !!user,
  });

  const handleExportCSV = () => {
    if (!transactions?.length) {
      toast.error("No transactions to export");
      return;
    }
    exportToCSV(transactions, `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success("Exported to CSV");
  };

  const handleExportPDF = () => {
    if (!transactions?.length) {
      toast.error("No transactions to export");
      return;
    }
    exportToPDF(transactions, `transactions-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Exported to PDF");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-transparent">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-xs sm:text-sm">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">All Transactions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {transactions?.length || 0} transaction{transactions?.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <TransactionFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories || []}
          onExportCSV={handleExportCSV}
          onExportXLSX={handleExportPDF}
        />

        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading transactions...
              </CardContent>
            </Card>
          ) : transactions?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No transactions found matching your filters
              </CardContent>
            </Card>
          ) : (
            transactions?.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                      <div
                        className="p-2 sm:p-3 rounded-full shrink-0"
                        style={{ backgroundColor: `${transaction.categories?.color}20`, color: transaction.categories?.color }}
                      >
                        <CategoryIcon iconName={transaction.categories?.icon || "tag"} size={24} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{transaction.title}</h3>
                          {transaction.is_recurring && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              <RepeatIcon className="h-3 w-3 mr-1" />
                              {transaction.recurring_frequency}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </p>
                        {transaction.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{transaction.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                      {transaction.receipt_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReceipt({ 
                            url: transaction.receipt_url!, 
                            title: transaction.title 
                          })}
                          className="text-xs"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Receipt</span>
                        </Button>
                      )}

                      <div className="text-right">
                        <p
                          className={`text-lg sm:text-xl font-bold ${
                            transaction.type === "income" ? "text-success" : "text-destructive"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(Number(transaction.amount))}
                        </p>
                        <Badge variant="outline" className="text-xs">{transaction.categories?.name}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <ReceiptPreviewDialog
        open={!!selectedReceipt}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
        receiptUrl={selectedReceipt?.url || null}
        transactionTitle={selectedReceipt?.title || ""}
      />
    </div>
  );
};

export default Transactions;
