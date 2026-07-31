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
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get only the authenticated user's recurring transactions
    const { data: recurringTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_recurring', true)
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;

    const today = new Date();
    const newTransactions = [];

    for (const transaction of recurringTransactions || []) {
      const lastDate = new Date(transaction.date);
      const daysSinceLastTransaction = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      let shouldCreate = false;
      const nextDate = new Date(lastDate);

      switch (transaction.recurring_frequency) {
        case 'daily':
          shouldCreate = daysSinceLastTransaction >= 1;
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          shouldCreate = daysSinceLastTransaction >= 7;
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          shouldCreate = daysSinceLastTransaction >= 30;
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          shouldCreate = daysSinceLastTransaction >= 365;
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      if (shouldCreate && nextDate <= today) {
        newTransactions.push({
          user_id: transaction.user_id,
          title: transaction.title,
          amount: transaction.amount,
          type: transaction.type,
          category_id: transaction.category_id,
          description: transaction.description,
          date: nextDate.toISOString().split('T')[0],
          is_recurring: false, // Don't make the generated transaction recurring
          recurring_frequency: null,
          receipt_url: null, // Don't copy receipts
        });
      }
    }

    if (newTransactions.length > 0) {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(newTransactions);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        created: newTransactions.length,
        message: `Created ${newTransactions.length} recurring transactions` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log full error server-side for debugging
    console.error('Error creating recurring transactions:', error);
    
    // Return generic message to client
    return new Response(
      JSON.stringify({ 
        error: 'Unable to create recurring transactions. Please try again.',
        code: 'RECURRING_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});


