import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get last 90 days of transactions
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return new Response(JSON.stringify({ error: 'Failed to fetch transactions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze spending patterns
    const categorySpending: Record<string, number[]> = {};
    const monthlyTotals: Record<string, number> = {};
    const weekdaySpending: number[] = Array(7).fill(0);
    const weekdayCount: number[] = Array(7).fill(0);

    transactions?.forEach((tx: any) => {
      const categoryName = tx.categories?.name || 'Uncategorized';
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const weekday = date.getDay();

      if (!categorySpending[categoryName]) {
        categorySpending[categoryName] = [];
      }
      categorySpending[categoryName].push(tx.amount);

      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + tx.amount;
      weekdaySpending[weekday] += tx.amount;
      weekdayCount[weekday]++;
    });

    // Calculate predictions
    const avgByCategory: Record<string, number> = {};
    Object.entries(categorySpending).forEach(([cat, amounts]) => {
      avgByCategory[cat] = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    });

    const monthlyValues = Object.values(monthlyTotals);
    const avgMonthly = monthlyValues.length > 0 
      ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length 
      : 0;

    // Calculate trend (simple linear regression)
    let trend = 0;
    if (monthlyValues.length >= 2) {
      const lastMonth = monthlyValues[monthlyValues.length - 1] || 0;
      const prevMonth = monthlyValues[monthlyValues.length - 2] || 0;
      trend = ((lastMonth - prevMonth) / prevMonth) * 100;
    }

    // Find peak spending days
    const avgByWeekday = weekdaySpending.map((total, i) => 
      weekdayCount[i] > 0 ? total / weekdayCount[i] : 0
    );
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDayIndex = avgByWeekday.indexOf(Math.max(...avgByWeekday));

    // Generate AI predictions using AI
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    
    const prompt = `Based on spending data analysis:
- Average monthly spending: â‚¹${avgMonthly.toFixed(0)}
- Monthly trend: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}%
- Top spending categories: ${Object.entries(avgByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat, avg]) => `${cat}: â‚¹${avg.toFixed(0)}`).join(', ')}
- Peak spending day: ${weekdays[peakDayIndex]}

Generate 3-4 specific, actionable predictions for next month in JSON format:
{
  "predictedTotal": number (estimated next month total),
  "predictions": [
    {"title": "prediction title", "description": "brief description", "type": "warning|opportunity|trend", "impact": "high|medium|low"}
  ],
  "savingsOpportunity": number (potential savings amount),
  "peakSpendingDay": "day name"
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("GROQ_MODEL") ?? "qwen/qwen3.6-27b",
        reasoning_format: "hidden",
        max_completion_tokens: 800,
        messages: [
          { role: "system", content: "You are an Indian financial advisor. Return ONLY valid JSON, no markdown." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI service error');
    }

    const aiData = await response.json();
    let predictions;
    
    try {
      const content = aiData.choices[0].message.content;
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
      predictions = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback predictions
      predictions = {
        predictedTotal: avgMonthly * 1.05,
        predictions: [
          { title: "Spending trending upward", description: "Your expenses are increasing month over month", type: "warning", impact: "medium" }
        ],
        savingsOpportunity: avgMonthly * 0.1,
        peakSpendingDay: weekdays[peakDayIndex]
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...predictions,
        avgMonthly,
        trend,
        categoryBreakdown: avgByCategory,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predict-spending:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


