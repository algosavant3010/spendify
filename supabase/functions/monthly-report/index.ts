import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.111.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const startOfPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endOfPrev = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const { data: current } = await supabase
      .from('transactions')
      .select('amount, type, title, date, categories(name)')
      .eq('user_id', user.id)
      .gte('date', startOfMonth);

    const { data: previous } = await supabase
      .from('transactions')
      .select('amount, type, categories(name)')
      .eq('user_id', user.id)
      .gte('date', startOfPrev)
      .lte('date', endOfPrev);

    const sum = (arr: any[], type?: string) => (arr || []).filter(t => !type || t.type === type).reduce((s, t) => s + Number(t.amount), 0);

    const income = sum(current || [], 'income');
    const expenses = sum(current || [], 'expense');
    const prevExpenses = sum(previous || [], 'expense');
    const prevIncome = sum(previous || [], 'income');

    const catMap: Record<string, number> = {};
    (current || []).filter(t => t.type === 'expense').forEach((t: any) => {
      const c = t.categories?.name || 'Uncategorized';
      catMap[c] = (catMap[c] || 0) + Number(t.amount);
    });
    const topCategories = Object.entries(catMap).sort(([, a], [, b]) => b - a).slice(0, 5);

    const prevCatMap: Record<string, number> = {};
    (previous || []).filter(t => t.type === 'expense').forEach((t: any) => {
      const c = t.categories?.name || 'Uncategorized';
      prevCatMap[c] = (prevCatMap[c] || 0) + Number(t.amount);
    });

    // Build AI narrative
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const prompt = `Generate a personalized monthly financial report narrative for an Indian user.

This Month:
- Income: â‚¹${income.toFixed(0)}
- Expenses: â‚¹${expenses.toFixed(0)}
- Net: â‚¹${(income - expenses).toFixed(0)}

Last Month:
- Income: â‚¹${prevIncome.toFixed(0)}
- Expenses: â‚¹${prevExpenses.toFixed(0)}

Top categories this month:
${topCategories.map(([c, a]) => `- ${c}: â‚¹${a.toFixed(0)} (last month: â‚¹${(prevCatMap[c] || 0).toFixed(0)})`).join('\n')}

Return JSON with these exact keys:
{
  "headline": "one-line summary of the month (max 12 words)",
  "wins": ["3 specific positive observations"],
  "concerns": ["3 specific concerns or overspends"],
  "actionPlan": ["4 specific actions for next month with â‚¹ amounts"]
}
Only return JSON, no markdown fences.`;

    let ai: any = { headline: 'Your monthly summary', wins: [], concerns: [], actionPlan: [] };
    if (GROQ_API_KEY) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: Deno.env.get('GROQ_MODEL') ?? 'qwen/qwen3.6-27b',
        reasoning_format: "hidden",
        max_completion_tokens: 800,
          messages: [
            { role: 'system', content: 'You are an Indian financial advisor. Always respond with raw JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      if (r.ok) {
        const j = await r.json();
        try { ai = JSON.parse(j.choices[0].message.content); } catch { /* keep default */ }
      } else if (r.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else if (r.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({
      month: now.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      income,
      expenses,
      net: income - expenses,
      prevIncome,
      prevExpenses,
      topCategories: topCategories.map(([name, amount]) => ({ name, amount, prev: prevCatMap[name] || 0 })),
      transactionCount: (current || []).length,
      ...ai,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('monthly-report error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


