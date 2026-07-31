import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, Users, Check, X, Trash2, Share2, ArrowLeft, 
  PieChart, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Calendar, DollarSign
} from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { format, subMonths, isAfter, startOfMonth } from "date-fns";
import logo from "@/assets/logo.png";

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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const ExpenseSplits = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [newSplit, setNewSplit] = useState({
    title: "",
    totalAmount: "",
    people: [{ name: "", email: "", amount: 0, paid: false }],
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

  const { data: splits, isLoading } = useQuery({
    queryKey: ["expense-splits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("expense_splits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        split_with: item.split_with as unknown as SplitPerson[],
      })) as ExpenseSplit[];
    },
    enabled: !!user,
  });

  const createSplit = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const filteredPeople = newSplit.people.filter(p => p.name);
      const { error } = await supabase.from("expense_splits").insert({
        user_id: user.id,
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
    const peopleCount = newSplit.people.length + 1;
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

  // Filter splits
  const filteredSplits = splits?.filter(split => {
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "settled" && split.settled) || 
      (filterStatus === "pending" && !split.settled);
    
    let periodMatch = true;
    if (filterPeriod !== "all") {
      const splitDate = new Date(split.created_at);
      const monthsAgo = parseInt(filterPeriod);
      periodMatch = isAfter(splitDate, subMonths(new Date(), monthsAgo));
    }
    
    return statusMatch && periodMatch;
  }) || [];

  // Analytics calculations
  const totalAmount = splits?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
  const settledAmount = splits?.filter(s => s.settled).reduce((sum, s) => sum + s.total_amount, 0) || 0;
  const pendingAmount = totalAmount - settledAmount;
  const settledCount = splits?.filter(s => s.settled).length || 0;
  const pendingCount = (splits?.length || 0) - settledCount;

  // Per-person analytics
  const personStats = splits?.reduce((acc, split) => {
    split.split_with.forEach(person => {
      if (!acc[person.name]) {
        acc[person.name] = { total: 0, paid: 0, pending: 0 };
      }
      acc[person.name].total += person.amount;
      if (person.paid) {
        acc[person.name].paid += person.amount;
      } else {
        acc[person.name].pending += person.amount;
      }
    });
    return acc;
  }, {} as Record<string, { total: number; paid: number; pending: number }>) || {};

  const personChartData = Object.entries(personStats).map(([name, stats]) => ({
    name,
    total: stats.total,
    paid: stats.paid,
    pending: stats.pending,
  })).sort((a, b) => b.total - a.total).slice(0, 5);

  // Monthly trend data
  const monthlyData = splits?.reduce((acc, split) => {
    const month = format(new Date(split.created_at), 'MMM yyyy');
    if (!acc[month]) {
      acc[month] = { month, total: 0, count: 0 };
    }
    acc[month].total += split.total_amount;
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { month: string; total: number; count: number }>) || {};

  const monthlyChartData = Object.values(monthlyData).slice(-6);

  const statusPieData = [
    { name: 'Settled', value: settledCount, color: 'hsl(var(--chart-2))' },
    { name: 'Pending', value: pendingCount, color: 'hsl(var(--chart-4))' },
  ].filter(d => d.value > 0);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-transparent">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-bold">Expense Splits</h1>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
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
                        <div className="grid grid-cols-3 gap-2">
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
                            placeholder="Amount"
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-interactive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Split</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-interactive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Settled</p>
                  <p className="text-xl font-bold">{formatCurrency(settledAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-interactive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{formatCurrency(pendingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-interactive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Splits</p>
                  <p className="text-xl font-bold">{splits?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <PieChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1">Last Month</SelectItem>
                  <SelectItem value="3">Last 3 Months</SelectItem>
                  <SelectItem value="6">Last 6 Months</SelectItem>
                  <SelectItem value="12">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Splits List */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredSplits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No expense splits found</p>
                  <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                    Create Your First Split
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSplits.map((split) => (
                  <motion.div
                    key={split.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="card-interactive">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{split.title}</h3>
                              {split.settled ? (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                  <Check className="h-3 w-3 mr-1" />
                                  Settled
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(split.total_amount)}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(split.created_at), 'MMM d, yyyy')}
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

                        <div className="grid gap-2">
                          {split.split_with.map((person, pIndex) => (
                            <div
                              key={pIndex}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div>
                                <span className="font-medium">{person.name}</span>
                                {person.email && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({person.email})
                                  </span>
                                )}
                                <span className="ml-3 font-semibold">
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
                                className={person.paid ? 'bg-green-500 hover:bg-green-600' : ''}
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
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPie>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} splits`, '']} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Top Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {personChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={personChartData} layout="vertical">
                        <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="paid" name="Paid" fill="hsl(var(--chart-2))" stackId="a" />
                        <Bar dataKey="pending" name="Pending" fill="hsl(var(--chart-4))" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Split Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'total' ? formatCurrency(value as number) : value,
                          name === 'total' ? 'Amount' : 'Count'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="total" name="Total Amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Average Split Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(splits?.length ? totalAmount / splits.length : 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Settlement Rate</p>
                  <p className="text-2xl font-bold">
                    {splits?.length ? Math.round((settledCount / splits.length) * 100) : 0}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">People Involved</p>
                  <p className="text-2xl font-bold">
                    {Object.keys(personStats).length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ExpenseSplits;
