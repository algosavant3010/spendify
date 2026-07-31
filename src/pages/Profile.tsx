import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Globe, Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import { exportToCSV, exportToPDF } from "@/utils/exportData";

const Profile = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [recurringAlerts, setRecurringAlerts] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=signin");
        return;
      }
      setUser(session.user);
      
      // Load preferences from localStorage
      setBudgetAlerts(localStorage.getItem('budgetAlerts') !== 'false');
      setRecurringAlerts(localStorage.getItem('recurringAlerts') !== 'false');
    };
    checkAuth();
  }, [navigate]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    toast.success(`Language changed to ${lang.toUpperCase()}`);
  };

  const handleBudgetAlertsChange = (checked: boolean) => {
    setBudgetAlerts(checked);
    localStorage.setItem('budgetAlerts', checked.toString());
    toast.success(checked ? "Budget alerts enabled" : "Budget alerts disabled");
  };

  const handleRecurringAlertsChange = (checked: boolean) => {
    setRecurringAlerts(checked);
    localStorage.setItem('recurringAlerts', checked.toString());
    toast.success(checked ? "Recurring alerts enabled" : "Recurring alerts disabled");
  };

  const handleExportCSV = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    
    if (data) {
      exportToCSV(data);
      toast.success("Data exported to CSV");
    }
  };

  const handleExportPDF = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    
    if (data) {
      exportToPDF(data);
      toast.success("Data exported to PDF");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-transparent">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm" className="text-xs sm:text-sm">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {t('dashboard')}
          </Button>
          <h1 className="text-lg sm:text-2xl font-bold">{t('profile')}</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t('language')}</Label>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('currency')}</Label>
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <span className="text-2xl">🇮🇳</span>
                  <div>
                    <p className="font-medium">Indian Rupee (₹)</p>
                    <p className="text-xs text-muted-foreground">Default currency</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('theme')}</Label>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <span className="text-sm text-muted-foreground">Toggle light/dark mode</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Budget Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when approaching budget limits
                  </p>
                </div>
                <Switch checked={budgetAlerts} onCheckedChange={handleBudgetAlertsChange} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recurring Transaction Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders for upcoming recurring transactions
                  </p>
                </div>
                <Switch checked={recurringAlerts} onCheckedChange={handleRecurringAlertsChange} />
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                {t('exportData')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your transaction data for backup or analysis
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  {t('downloadCSV')}
                </Button>
                <Button onClick={handleExportPDF} variant="outline" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  {t('downloadPDF')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
