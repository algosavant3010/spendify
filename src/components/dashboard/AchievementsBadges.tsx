import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, Award, Flame, Star } from "lucide-react";
import { motion } from "framer-motion";

interface AchievementsBadgesProps {
  userId: string;
}

const AchievementsBadges = ({ userId }: AchievementsBadgesProps) => {
  const { data: achievements } = useQuery({
    queryKey: ["achievements", userId],
    queryFn: async () => {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId);

      if (!transactions) return [];

      const earned = [];

      // First Transaction
      if (transactions.length >= 1) {
        earned.push({
          id: "first-transaction",
          name: "Getting Started",
          description: "Added your first transaction",
          icon: Star,
          color: "text-blue-500",
        });
      }

      // Consistent Tracker (10+ transactions)
      if (transactions.length >= 10) {
        earned.push({
          id: "consistent-tracker",
          name: "Consistent Tracker",
          description: "Tracked 10+ transactions",
          icon: Flame,
          color: "text-orange-500",
        });
      }

      // Budget Master
      if ((budgets?.length || 0) >= 3) {
        earned.push({
          id: "budget-master",
          name: "Budget Master",
          description: "Created 3+ budgets",
          icon: Target,
          color: "text-purple-500",
        });
      }

      // Savings Champion
      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      if (income > 0 && ((income - expenses) / income) > 0.2) {
        earned.push({
          id: "savings-champion",
          name: "Savings Champion",
          description: "Saved 20%+ of income",
          icon: TrendingUp,
          color: "text-green-500",
        });
      }

      // Money Manager
      if (transactions.length >= 50) {
        earned.push({
          id: "money-manager",
          name: "Money Manager",
          description: "Tracked 50+ transactions",
          icon: Award,
          color: "text-yellow-500",
        });
      }

      // Financial Guru
      if (transactions.length >= 100) {
        earned.push({
          id: "financial-guru",
          name: "Financial Guru",
          description: "Tracked 100+ transactions",
          icon: Trophy,
          color: "text-gold-500",
        });
      }

      return earned;
    },
  });

  if (!achievements || achievements.length === 0) return null;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Icon className={`h-8 w-8 mb-2 ${achievement.color}`} />
                <div className="text-xs font-semibold text-center mb-1">
                  {achievement.name}
                </div>
                <div className="text-[10px] text-muted-foreground text-center">
                  {achievement.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsBadges;
