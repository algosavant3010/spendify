import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.111.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

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
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input - limit to 100 transactions max
    const transactionSchema = z.object({
      type: z.enum(['income', 'expense']),
      amount: z.number().positive(),
      categories: z.object({ name: z.string() }).optional()
    });

    const inputSchema = z.object({
      transactions: z.array(transactionSchema).max(100, 'Maximum 100 transactions allowed')
    });

    const rawBody = await req.json();
    
    const validationResult = inputSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transactions } = validationResult.data;
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error. Please contact support.',
          code: 'CONFIG_ERROR'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare transaction summary for AI
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const categoryBreakdown = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((acc: any, t: any) => {
        const category = t.categories?.name || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Number(t.amount);
        return acc;
      }, {});

    const prompt = `You are an expert Indian financial advisor analyzing spending patterns. Provide 4-5 personalized, actionable insights.

Financial Summary:
- Total Income: â‚¹${totalIncome.toFixed(2)}
- Total Expenses: â‚¹${totalExpenses.toFixed(2)}
- Net Savings: â‚¹${(totalIncome - totalExpenses).toFixed(2)}
- Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%

Category-wise Spending:
${Object.entries(categoryBreakdown)
  .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
  .map(([cat, amount]: [string, any]) => {
    const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
    return `- ${cat}: â‚¹${amount.toFixed(2)} (${percentage}%)`;
  }).join('\n')}

Provide specific, data-driven recommendations considering:
1. Highest spending categories and optimization opportunities
2. Savings rate improvement strategies specific to Indian context
3. Category-specific budget recommendations
4. Tax saving opportunities (80C, 80D, etc.) if relevant
5. Emergency fund and investment suggestions

IMPORTANT: 
- Use Indian Rupee (â‚¹) symbol in all amounts
- Consider Indian financial landscape (mutual funds, PPF, EPF, etc.)
- Be specific with amounts and percentages
- Keep each insight under 25 words
- Focus on immediate actionable steps

Format as a numbered list of 4-5 concise, specific insights.`;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('GROQ_MODEL') ?? 'qwen/qwen3.6-27b',
        reasoning_format: "hidden",
        max_completion_tokens: 800,
        messages: [
          { 
            role: 'system', 
            content: 'You are an experienced Indian financial advisor. Provide practical, specific advice using Indian Rupees (â‚¹) and considering Indian financial products and tax benefits. Be concise, data-driven, and actionable.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI service credits exhausted. Please top up your credits.',
            code: 'PAYMENT_REQUIRED'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Unable to process your request. Please try again.',
          code: 'AI_SERVICE_ERROR',
          status: response.status
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    const insightsText = data.choices[0].message.content;
    
    // Parse numbered or bullet points into array
    const insights = insightsText
      .split('\n')
      .filter((line: string) => line.trim().match(/^(\d+\.|\d+\)|-|â€¢|\*)/))
      .map((line: string) => line.replace(/^(\d+\.|\d+\)|-|â€¢|\*)\s*/, '').trim())
      .filter((line: string) => line.length > 0);

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log full error server-side for debugging
    console.error('Error in generate-insights:', error);
    
    // Return generic message to client
    return new Response(
      JSON.stringify({ 
        error: 'Unable to generate insights. Please try again.',
        code: 'INSIGHTS_ERROR'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


