import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.111.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

interface DetectedBill {
  title: string;
  averageAmount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  occurrences: number;
  lastDate: string;
  nextExpectedDate: string;
  category: string;
  confidence: number;
  isUnused: boolean;
  daysSinceLast: number;
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

    // Get last 6 months of expense transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: txns } = await supabase
      .from('transactions')
      .select('title, amount, date, categories(name)')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', sixMonthsAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!txns || txns.length === 0) {
      return new Response(JSON.stringify({ bills: [], totalMonthly: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Group by normalized title
    const groups: Record<string, any[]> = {};
    txns.forEach((t: any) => {
      const key = t.title.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\d+/g, '').trim();
      if (!key) return;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    const bills: DetectedBill[] = [];
    const today = new Date();

    for (const [, items] of Object.entries(groups)) {
      if (items.length < 2) continue;

      // Sort by date
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Compute intervals between consecutive dates (days)
      const intervals: number[] = [];
      for (let i = 1; i < items.length; i++) {
        const days = Math.round((new Date(items[i].date).getTime() - new Date(items[i - 1].date).getTime()) / (1000 * 60 * 60 * 24));
        if (days > 0) intervals.push(days);
      }
      if (intervals.length === 0) continue;

      const avgInterval = intervals.reduce((s, x) => s + x, 0) / intervals.length;
      const variance = intervals.reduce((s, x) => s + Math.abs(x - avgInterval), 0) / intervals.length;

      // Recurring if intervals are reasonably consistent
      let frequency: 'weekly' | 'monthly' | 'yearly' | null = null;
      if (avgInterval >= 6 && avgInterval <= 9 && variance < 4) frequency = 'weekly';
      else if (avgInterval >= 26 && avgInterval <= 35 && variance < 8) frequency = 'monthly';
      else if (avgInterval >= 350 && avgInterval <= 380) frequency = 'yearly';

      if (!frequency) continue;

      const avgAmount = items.reduce((s, x) => s + Number(x.amount), 0) / items.length;
      const amountVariance = items.reduce((s, x) => s + Math.abs(Number(x.amount) - avgAmount), 0) / items.length;
      // Skip if amounts vary wildly
      if (amountVariance / avgAmount > 0.4) continue;

      const lastDate = items[items.length - 1].date;
      const lastDateObj = new Date(lastDate);
      const nextDate = new Date(lastDateObj);
      nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

      const daysSinceLast = Math.floor((today.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
      const expectedInterval = Math.round(avgInterval);
      const isUnused = daysSinceLast > expectedInterval * 2;

      const confidence = Math.min(100, Math.round((items.length / 6) * 50 + (1 - Math.min(variance / avgInterval, 1)) * 50));

      bills.push({
        title: items[items.length - 1].title,
        averageAmount: Math.round(avgAmount),
        frequency,
        occurrences: items.length,
        lastDate,
        nextExpectedDate: nextDate.toISOString().split('T')[0],
        category: items[items.length - 1].categories?.name || 'Uncategorized',
        confidence,
        isUnused,
        daysSinceLast,
      });
    }

    // Total monthly equivalent
    const totalMonthly = bills.reduce((s, b) => {
      if (b.isUnused) return s;
      if (b.frequency === 'weekly') return s + b.averageAmount * 4.33;
      if (b.frequency === 'monthly') return s + b.averageAmount;
      return s + b.averageAmount / 12;
    }, 0);

    bills.sort((a, b) => b.averageAmount - a.averageAmount);

    return new Response(JSON.stringify({ bills, totalMonthly: Math.round(totalMonthly) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('detect-bills error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


