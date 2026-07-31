import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BudgetManagement from "@/components/budget/BudgetManagement";
import { useTranslation } from "react-i18next";

const Budgets = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-transparent">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-xs sm:text-sm">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {t('dashboard')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('manageBudgets')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create and track budgets for different time periods
          </p>
        </div>

        <BudgetManagement userId={user.id} />
      </main>
    </div>
  );
};

export default Budgets;
