import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.111.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

interface Anomaly {
  type: 'category_spike' | 'large_transaction' | 'frequency_spike';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  amount?: number;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const { data: recent } = await supabase
      .from('transactions')
      .select('amount, title, date, categories(name)')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

    const { data: baseline } = await supabase
      .from('transactions')
      .select('amount, categories(name)')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
      .lt('date', sevenDaysAgo.toISOString().split('T')[0]);

    const anomalies: Anomaly[] = [];

    // Category spike
    const recentByCat: Record<string, number> = {};
    (recent || []).forEach((t: any) => {
      const c = t.categories?.name || 'Uncategorized';
      recentByCat[c] = (recentByCat[c] || 0) + Number(t.amount);
    });
    const baselineByCat: Record<string, number> = {};
    (baseline || []).forEach((t: any) => {
      const c = t.categories?.name || 'Uncategorized';
      baselineByCat[c] = (baselineByCat[c] || 0) + Number(t.amount);
    });

    for (const [cat, recentAmt] of Object.entries(recentByCat)) {
      const weeklyAvg = (baselineByCat[cat] || 0) / 12; // 12 weeks in baseline window
      if (weeklyAvg < 100) continue;
      const ratio = recentAmt / weeklyAvg;
      if (ratio >= 2) {
        anomalies.push({
          type: 'category_spike',
          severity: ratio >= 3 ? 'high' : 'medium',
          title: `${cat} spending up ${ratio.toFixed(1)}x`,
          description: `You spent â‚¹${recentAmt.toFixed(0)} on ${cat} this week vs your usual â‚¹${weeklyAvg.toFixed(0)}`,
          amount: recentAmt,
          category: cat,
        });
      }
    }

    // Large transaction (top 5% of historical amounts)
    const allAmounts = (baseline || []).map((t: any) => Number(t.amount)).sort((a, b) => a - b);
    const p95 = allAmounts.length > 20 ? allAmounts[Math.floor(allAmounts.length * 0.95)] : null;
    if (p95) {
      (recent || []).forEach((t: any) => {
        const amt = Number(t.amount);
        if (amt > p95 * 1.5) {
          anomalies.push({
            type: 'large_transaction',
            severity: amt > p95 * 3 ? 'high' : 'medium',
            title: `Unusually large: ${t.title}`,
            description: `â‚¹${amt.toFixed(0)} is much higher than your typical purchase (â‚¹${p95.toFixed(0)})`,
            amount: amt,
            category: t.categories?.name,
          });
        }
      });
    }

    // Frequency spike
    const baselineDailyCount = (baseline || []).length / 83;
    const recentDailyCount = (recent || []).length / 7;
    if (baselineDailyCount > 0.5 && recentDailyCount > baselineDailyCount * 2) {
      anomalies.push({
        type: 'frequency_spike',
        severity: 'medium',
        title: `${(recent || []).length} transactions this week`,
        description: `That's ${(recentDailyCount / baselineDailyCount).toFixed(1)}x your normal pace. Check for impulse spending.`,
      });
    }

    return new Response(JSON.stringify({ anomalies }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('detect-anomalies error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


