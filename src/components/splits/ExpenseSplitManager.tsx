import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Users, Check, X, Trash2, Share2 } from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { motion, AnimatePresence } from "framer-motion";

interface SplitPerson {
  name: string;
  email: string;
  amount: number;
  paid: boolean;
}

interface ExpenseSplit {
  id: string;
  title: string;
  total_amount: number;
  split_with: SplitPerson[];
  settled: boolean;
  created_at: string;
}

interface ExpenseSplitManagerProps {
  userId: string;
}

const ExpenseSplitManager = ({ userId }: ExpenseSplitManagerProps) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSplit, setNewSplit] = useState({
    title: "",
    totalAmount: "",
    people: [{ name: "", email: "", amount: 0, paid: false }],
  });

  const { data: splits, isLoading } = useQuery({
    queryKey: ["expense-splits", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_splits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        split_with: item.split_with as unknown as SplitPerson[],
      })) as ExpenseSplit[];
    },
  });

  const createSplit = useMutation({
    mutationFn: async () => {
      const filteredPeople = newSplit.people.filter(p => p.name);
      const { error } = await supabase.from("expense_splits").insert({
        user_id: userId,
        title: newSplit.title,
        total_amount: parseFloat(newSplit.totalAmount),
        split_with: JSON.parse(JSON.stringify(filteredPeople)),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-splits"] });
      toast.success("Expense split created!");
      setIsDialogOpen(false);
      setNewSplit({ title: "", totalAmount: "", people: [{ name: "", email: "", amount: 0, paid: false }] });
    },
    onError: () => toast.error("Failed to create expense split"),
  });

  const updatePaidStatus = useMutation({
    mutationFn: async ({ splitId, personIndex, paid }: { splitId: string; personIndex: number; paid: boolean }) => {
      const split = splits?.find(s => s.id === splitId);
      if (!split) return;

      const updatedPeople = [...split.split_with];
      updatedPeople[personIndex].paid = paid;

      const allPaid = updatedPeople.every(p => p.paid);

      const { error } = await supabase
        .from("expense_splits")
        .update({ split_with: JSON.parse(JSON.stringify(updatedPeople)), settled: allPaid })
        .eq("id", splitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-splits"] });
      toast.success("Status updated!");
    },
  });

  const deleteSplit = useMutation({
    mutationFn: async (splitId: string) => {
      const { error } = await supabase
        .from("expense_splits")
        .delete()
        .eq("id", splitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-splits"] });
      toast.success("Split deleted!");
    },
  });

  const addPerson = () => {
    setNewSplit(prev => ({
      ...prev,
      people: [...prev.people, { name: "", email: "", amount: 0, paid: false }],
    }));
  };

  const removePerson = (index: number) => {
    setNewSplit(prev => ({
      ...prev,
      people: prev.people.filter((_, i) => i !== index),
    }));
  };

  const updatePerson = (index: number, field: keyof SplitPerson, value: string | number | boolean) => {
    setNewSplit(prev => ({
      ...prev,
      people: prev.people.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const splitEqually = () => {
    const total = parseFloat(newSplit.totalAmount) || 0;
    const peopleCount = newSplit.people.length + 1; // +1 for self
    const perPerson = total / peopleCount;
    
    setNewSplit(prev => ({
      ...prev,
      people: prev.people.map(p => ({ ...p, amount: Math.round(perPerson * 100) / 100 })),
    }));
  };

  const handleShare = async (split: ExpenseSplit) => {
    const shareText = `💰 ${split.title}\nTotal: ${formatCurrency(split.total_amount)}\n\n${split.split_with.map(p => 
      `${p.name}: ${formatCurrency(p.amount)} ${p.paid ? '✅' : '❌'}`
    ).join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: split.title, text: shareText });
      } catch (e) {
        console.error('Share failed:', e);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const navigate = useNavigate();
  
  return (
    <Card className="card-interactive">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Expense Splits
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/expense-splits')}>
            View All
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Split
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Expense Split</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Dinner at restaurant"
                  value={newSplit.title}
                  onChange={(e) => setNewSplit({ ...newSplit, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Total Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newSplit.totalAmount}
                  onChange={(e) => setNewSplit({ ...newSplit, totalAmount: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Split With</Label>
                <Button type="button" variant="outline" size="sm" onClick={splitEqually}>
                  Split Equally
                </Button>
              </div>

              <AnimatePresence>
                {newSplit.people.map((person, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg border bg-muted/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Person {index + 1}</span>
                      {newSplit.people.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePerson(index)}
                          className="h-6 w-6 p-0 text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        placeholder="Name"
                        value={person.name}
                        onChange={(e) => updatePerson(index, "name", e.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={person.email}
                        onChange={(e) => updatePerson(index, "email", e.target.value)}
                      />
                      <Input
                        placeholder="Amount (₹)"
                        type="number"
                        value={person.amount || ""}
                        onChange={(e) => updatePerson(index, "amount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button type="button" variant="outline" onClick={addPerson} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Person
              </Button>

              <Button
                onClick={() => createSplit.mutate()}
                disabled={!newSplit.title || !newSplit.totalAmount || createSplit.isPending}
                className="w-full"
              >
                {createSplit.isPending ? "Creating..." : "Create Split"}
              </Button>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : splits?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No expense splits yet. Create one to track shared expenses!
          </p>
        ) : (
          <div className="space-y-3">
            {splits?.map((split) => (
              <motion.div
                key={split.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {split.title}
                      {split.settled && (
                        <Badge variant="default" className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Settled
                        </Badge>
                      )}
                    </h4>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(split.total_amount)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(split)}
                      className="h-8 w-8 p-0"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSplit.mutate(split.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {split.split_with.map((person, pIndex) => (
                    <div
                      key={pIndex}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{person.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(person.amount)}
                        </span>
                      </div>
                      <Button
                        variant={person.paid ? "default" : "outline"}
                        size="sm"
                        onClick={() => updatePaidStatus.mutate({
                          splitId: split.id,
                          personIndex: pIndex,
                          paid: !person.paid,
                        })}
                        className={`h-7 w-full sm:w-auto ${person.paid ? 'bg-green-500 hover:bg-green-600' : ''}`}
                      >
                        {person.paid ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Paid
                          </>
                        ) : (
                          "Mark Paid"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseSplitManager;
