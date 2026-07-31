import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Target, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  onAddTransaction: () => void;
}

const QuickActions = ({ onAddTransaction }: QuickActionsProps) => {
  const navigate = useNavigate();
  
  const actions = [
    { icon: Plus, label: "Add Transaction", color: "primary", onClick: onAddTransaction },
    { icon: Target, label: "Savings Goals", color: "warning", onClick: () => navigate("/savings-goals") },
    { icon: TrendingUp, label: "Analytics", color: "success", onClick: () => navigate("/analytics") },
    { icon: FileText, label: "View Profile", color: "secondary", onClick: () => navigate("/profile") },
  ];

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const colorClasses = {
              primary: "bg-primary/10 text-primary",
              warning: "bg-warning/10 text-warning",
              success: "bg-success/10 text-success",
              secondary: "bg-secondary/10 text-secondary",
            };
            
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-center gap-2 p-4 hover:scale-105 transition-transform"
                  onClick={action.onClick}
                >
                  <div className={`p-2 rounded-lg ${colorClasses[action.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
