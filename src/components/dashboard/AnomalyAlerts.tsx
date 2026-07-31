import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
}

const severityStyle = (s: string) =>
  s === 'high' ? 'bg-destructive/10 border-destructive/40 text-destructive'
  : s === 'medium' ? 'bg-warning/10 border-warning/40 text-warning'
  : 'bg-muted border-border';

const AnomalyAlerts = ({ userId }: { userId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["anomalies", userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("detect-anomalies");
      if (error) throw error;
      return data as { anomalies: Anomaly[] };
    },
  });

  const anomalies = data?.anomalies || [];

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Spending Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : anomalies.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            All spending looks normal this week
          </div>
        ) : (
          anomalies.slice(0, 4).map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-3 rounded-lg border ${severityStyle(a.severity)}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold text-sm">{a.title}</div>
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">{a.severity}</Badge>
              </div>
              <p className="text-xs opacity-90">{a.description}</p>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AnomalyAlerts;
