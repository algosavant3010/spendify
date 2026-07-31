import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Settings, Target, Menu, Users, Sparkles, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import StatsCards from "@/components/dashboard/StatsCards";
import SpendingChart from "@/components/dashboard/SpendingChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import AIInsights from "@/components/dashboard/AIInsights";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import QuickActions from "@/components/dashboard/QuickActions";
import SpendingTrend from "@/components/dashboard/SpendingTrend";
import FinancialHealthScore from "@/components/dashboard/FinancialHealthScore";
import AchievementsBadges from "@/components/dashboard/AchievementsBadges";
import SpendingPredictions from "@/components/dashboard/SpendingPredictions";
import ExpenseSplitManager from "@/components/splits/ExpenseSplitManager";
import AnomalyAlerts from "@/components/dashboard/AnomalyAlerts";
import MonthlyReportButton from "@/components/dashboard/MonthlyReportButton";
import AddTransactionDialog from "@/components/transactions/AddTransactionDialog";
import logo from "@/assets/logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth?mode=signin");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-transparent">
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 rounded-sm bg-foreground text-background grid place-items-center font-display text-xl shrink-0">S</div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h1 className="font-display text-xl sm:text-2xl leading-none">Spendify</h1>
                <span className="eyebrow hidden sm:inline">Ledger</span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-none">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-1.5 items-center">
            <ThemeToggle />
            <Button onClick={() => navigate('/advisor')} size="sm" variant="outline" className="group hidden md:inline-flex rounded-sm">
              <Sparkles className="h-4 w-4 mr-1.5 transition-transform group-hover:scale-110" /> Advisor
            </Button>
            <MonthlyReportButton />
            <Button onClick={() => navigate('/bills')} variant="ghost" size="sm" className="hidden xl:inline-flex">
              <Receipt className="h-4 w-4 mr-1.5" /> Bills
            </Button>
            <Button onClick={() => navigate('/budgets')} variant="ghost" size="sm" className="hidden xl:inline-flex">
              <Target className="h-4 w-4 mr-1.5" /> {t('budgets')}
            </Button>
            <Button onClick={() => navigate('/profile')} variant="ghost" size="sm" className="hidden xl:inline-flex">
              <Settings className="h-4 w-4 mr-1.5" /> {t('profile')}
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="group hidden sm:inline-flex rounded-sm">
              <Plus className="h-4 w-4 mr-1.5 transition-transform group-hover:rotate-90" /> <span className="hidden md:inline">{t('addTransaction')}</span><span className="md:hidden">Add</span>
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="icon" className="hidden xl:inline-flex">
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile / tablet menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="xl:hidden rounded-sm h-9 w-9">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="font-display text-3xl text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-8">
                  <Button onClick={() => { setIsAddDialogOpen(true); setIsMobileMenuOpen(false); }} className="w-full justify-start rounded-sm">
                    <Plus className="h-4 w-4 mr-2" /> {t('addTransaction')}
                  </Button>
                  <Button onClick={() => { navigate('/advisor'); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start rounded-sm">
                    <Sparkles className="h-4 w-4 mr-2" /> AI Advisor
                  </Button>
                  <Button onClick={() => { navigate('/bills'); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start rounded-sm">
                    <Receipt className="h-4 w-4 mr-2" /> Bills
                  </Button>
                  <Button onClick={() => { navigate('/analytics'); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start rounded-sm">
                    <Plus className="h-4 w-4 mr-2" /> Analytics
                  </Button>
                  <Button onClick={() => { navigate('/savings-goals'); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start rounded-sm">
                    <Target className="h-4 w-4 mr-2" /> Savings Goals
                  </Button>
                  <Button onClick={() => { navigate('/budgets'); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start rounded-sm">
                    <Target className="h-4 w-4 mr-2" /> {t('budgets')}
                  </Button>
                  <Button onClick={() => { navigate('/expense-splits'); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start rounded-sm">
                    <Users className="h-4 w-4 mr-2" /> Expense Splits
                  </Button>
                  <Button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start rounded-sm">
                    <Settings className="h-4 w-4 mr-2" /> {t('profile')}
                  </Button>
                  <Button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} variant="ghost" className="w-full justify-start mt-4">
                    <LogOut className="h-4 w-4 mr-2" /> {t('signOut')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-16 space-y-8 sm:space-y-10 lg:space-y-12">
        {/* Editorial masthead */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="eyebrow mb-3 sm:mb-4 flex-wrap">
              <span className="h-px w-6 sm:w-8 bg-foreground/40" />
              <span className="truncate">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <h2 className="font-display text-[2.25rem] leading-[1] sm:text-5xl md:text-6xl max-w-[14ch]">
              Your <span className="accent-italic">ledger,</span> today.
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-[46ch] leading-relaxed">
              A quiet brief on the money moving through your day.
            </p>
          </div>
          <div className="hidden lg:block text-right shrink-0">
            <div className="eyebrow mb-1 justify-end">Edition</div>
            <div className="font-display text-2xl tabular">№ {new Date().getMonth() + 1}.{new Date().getFullYear()}</div>
          </div>
        </div>

        <div className="hairline" />

        <StatsCards userId={user.id} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
              <SpendingTrend userId={user.id} />
              <QuickActions onAddTransaction={() => setIsAddDialogOpen(true)} />
            </div>
            <SpendingChart userId={user.id} />
            <ExpenseSplitManager userId={user.id} />
            <RecentTransactions userId={user.id} />
          </div>

          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            <AnomalyAlerts userId={user.id} />
            <FinancialHealthScore userId={user.id} />
            <SpendingPredictions userId={user.id} />
            <BudgetOverview userId={user.id} />
            <AchievementsBadges userId={user.id} />
            <CategoryBreakdown userId={user.id} />
            <AIInsights userId={user.id} />
          </div>
        </div>
      </main>


      <AddTransactionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        userId={user.id}
      />
    </div>
  );
};

export default Dashboard;
