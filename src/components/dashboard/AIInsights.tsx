import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface AIInsightsProps {
  userId: string;
}

const AIInsights = ({ userId }: AIInsightsProps) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  const { data: transactions } = useQuery({
    queryKey: ["transactions-for-ai", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("amount, type, date, categories(name)")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(50);

      return data;
    },
  });

  const generateInsights = async () => {
    if (!transactions || transactions.length === 0) {
      toast.error("Not enough transaction data to generate insights");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to use AI insights");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-insights", {
        body: { transactions },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error generating insights:", error);
        if (error.message?.includes('429')) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (error.message?.includes('402')) {
          toast.error("AI service requires payment. Please contact support.");
        } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast.error("Please sign in to use AI insights.");
        } else if (error.message?.includes('VALIDATION_ERROR')) {
          toast.error("Invalid transaction data. Please add more transactions.");
        } else {
          toast.error(`Failed to generate insights: ${error.message || 'Please try again.'}`);
        }
        return;
      }
      
      if (data?.insights && data.insights.length > 0) {
        setInsights(data.insights);
        toast.success("AI insights generated!");
      } else {
        toast.info("No insights available at this time");
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="shadow-md bg-gradient-primary text-primary-foreground hover:shadow-lg transition-shadow">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('aiInsights')}
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {insights.length > 0 ? (
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="text-xs sm:text-sm bg-primary-foreground/10 p-2 sm:p-3 rounded-md border border-primary-foreground/10 backdrop-blur-sm">
                {insight}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs sm:text-sm opacity-90">
            Get personalized financial recommendations based on your spending patterns
          </p>
        )}
        
        <Button
          onClick={generateInsights}
          disabled={isGenerating || !transactions || transactions.length === 0}
          variant="secondary"
          className="w-full text-xs sm:text-sm"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
              {t('analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {t('generateInsights')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default AIInsights;
