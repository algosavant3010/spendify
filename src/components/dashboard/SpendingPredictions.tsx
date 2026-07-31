import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Sparkles, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { motion, AnimatePresence } from "framer-motion";

interface SpendingPredictionsProps {
  userId: string;
}

interface Prediction {
  title: string;
  description: string;
  type: "warning" | "opportunity" | "trend";
  impact: "high" | "medium" | "low";
}

const SpendingPredictions = ({ userId }: SpendingPredictionsProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["spending-predictions", userId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("predict-spending", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      return data.data;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "opportunity":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "trend":
        return <TrendingUp className="h-4 w-4 text-primary" />;
      default:
        return <Sparkles className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "low":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card className="card-interactive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-interactive overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Smart Predictions
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Predicted Total */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Next Month Prediction</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(data?.predictedTotal || 0)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(data?.trend || 0) > 0 ? (
                <TrendingUp className="h-5 w-5 text-destructive" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
              <span className={`text-sm font-medium ${(data?.trend || 0) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                {(data?.trend || 0) > 0 ? '+' : ''}{(data?.trend || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Savings Opportunity */}
        {data?.savingsOpportunity > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                Potential savings: {formatCurrency(data.savingsOpportunity)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Predictions List */}
        <AnimatePresence>
          <div className="space-y-3">
            {data?.predictions?.map((prediction: Prediction, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 2) }}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {getIcon(prediction.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{prediction.title}</p>
                      <Badge variant="outline" className={`text-xs ${getImpactColor(prediction.impact)}`}>
                        {prediction.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {prediction.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Peak Spending Day */}
        {data?.peakSpendingDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-2 border-t"
          >
            <p className="text-xs text-muted-foreground text-center">
              📅 Peak spending day: <span className="font-medium">{data.peakSpendingDay}</span>
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendingPredictions;
