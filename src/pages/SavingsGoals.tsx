import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Target, Trash2, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currency";

const SavingsGoals = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const queryClient = useQueryClient();

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

  const { data: goals } = useQuery({
    queryKey: ["savings-goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const { error } = await supabase.from("savings_goals").insert([goalData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      toast.success("Savings goal created!");
      setIsDialogOpen(false);
      setGoalName("");
      setTargetAmount("");
      setCurrentAmount("");
      setTargetDate("");
    },
    onError: () => {
      toast.error("Failed to create savings goal");
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      toast.success("Goal deleted");
    },
  });

  const handleCreateGoal = () => {
    if (!goalName || !targetAmount || !user) return;

    createGoalMutation.mutate({
      user_id: user.id,
      name: goalName,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      target_date: targetDate || null,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-transparent">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Savings Goals</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Goal Name</Label>
                  <Input 
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g., Emergency Fund"
                  />
                </div>
                <div>
                  <Label>Target Amount</Label>
                  <Input 
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label>Current Amount (Optional)</Label>
                  <Input 
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Target Date (Optional)</Label>
                  <Input 
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateGoal} className="w-full">
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {goals && goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const daysLeft = goal.target_date 
                ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Card key={goal.id} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        {goal.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-semibold">{formatCurrency(goal.current_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target</span>
                        <span className="font-semibold">{formatCurrency(goal.target_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(goal.target_amount - goal.current_amount)}
                        </span>
                      </div>
                    </div>

                    {daysLeft !== null && (() => {
                      const remaining = goal.target_amount - goal.current_amount;
                      const monthsLeft = Math.max(daysLeft / 30, 0.1);
                      const requiredMonthly = remaining > 0 ? remaining / monthsLeft : 0;
                      const onTrack = daysLeft > 0 && requiredMonthly < 50000;
                      return (
                        <div className="pt-3 border-t space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> Save monthly
                            </span>
                            <span className="font-bold text-primary">
                              {remaining > 0 ? formatCurrency(Math.ceil(requiredMonthly)) : "Goal hit! 🎉"}
                            </span>
                          </div>
                          <div className={`flex items-center justify-center gap-1 text-xs px-2 py-1 rounded-md ${
                            daysLeft <= 0 ? "bg-destructive/10 text-destructive"
                            : onTrack ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                          }`}>
                            {daysLeft <= 0 ? <><AlertCircle className="h-3 w-3" /> Target date passed</>
                              : <>{daysLeft} days left{!onTrack && remaining > 0 && " — aggressive pace"}</>}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Savings Goals Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first savings goal to start tracking your progress</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SavingsGoals;
