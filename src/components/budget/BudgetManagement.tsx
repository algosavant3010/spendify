import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/currency";

interface BudgetManagementProps {
  userId: string;
}

const BudgetManagement = ({ userId }: BudgetManagementProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data: categories } = useQuery({
    queryKey: ["categories", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "expense");
      return data || [];
    },
  });

  const { data: budgets } = useQuery({
    queryKey: ["budgets-management", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("budgets")
        .select("*, categories(name, color, icon)")
        .eq("user_id", userId);
      return data || [];
    },
  });

  const createBudget = useMutation({
    mutationFn: async (newBudget: any) => {
      const { error } = await supabase.from("budgets").insert(newBudget);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets-management", userId] });
      toast.success("Budget created successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to create budget"),
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("budgets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets-management", userId] });
      toast.success("Budget updated successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to update budget"),
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets-management", userId] });
      toast.success("Budget deleted successfully");
    },
    onError: () => toast.error("Failed to delete budget"),
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setPeriod('monthly');
    setAmount('');
    setCategoryId('');
  };

  const handleSubmit = () => {
    if (!amount || !categoryId) {
      toast.error("Please fill all fields");
      return;
    }

    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    let endDate = '';

    if (period === 'monthly') {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate = end.toISOString().split('T')[0];
    } else if (period === 'quarterly') {
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      endDate = end.toISOString().split('T')[0];
    } else {
      const end = new Date(now.getFullYear(), 11, 31);
      endDate = end.toISOString().split('T')[0];
    }

    const budgetData = {
      user_id: userId,
      category_id: categoryId,
      amount: parseFloat(amount),
      period,
      start_date: startDate,
      end_date: endDate,
    };

    if (editingId) {
      updateBudget.mutate({ id: editingId, updates: budgetData });
    } else {
      createBudget.mutate(budgetData);
    }
  };

  const handleEdit = (budget: any) => {
    setEditingId(budget.id);
    setPeriod(budget.period);
    setAmount(budget.amount.toString());
    setCategoryId(budget.category_id);
    setIsDialogOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base sm:text-lg">{t('manageBudgets')}</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="self-start sm:self-auto text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">{editingId ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="text-xs sm:text-sm">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Period</Label>
                  <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full text-xs sm:text-sm">
                  {editingId ? 'Update' : 'Create'} Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            {budgets?.map((budget) => (
              <div key={budget.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm sm:text-base">{budget.categories?.name}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground capitalize">{budget.period}</p>
                  </div>
                  <div className="flex gap-2 self-start">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(budget)}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBudget.mutate(budget.id)}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm gap-1">
                    <span>Budget: {formatCurrency(Number(budget.amount))}</span>
                    <span className="text-muted-foreground">{budget.start_date} to {budget.end_date}</span>
                  </div>
                </div>
              </div>
            ))}
            {budgets?.length === 0 && (
              <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">
                No budgets set. Click "Add Budget" to create one.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BudgetManagement;
