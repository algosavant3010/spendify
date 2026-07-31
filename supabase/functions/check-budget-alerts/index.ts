import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.111.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

Deno.serve(async (req) => {
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get only the authenticated user's budgets
    const { data: budgets, error: budgetsError } = await supabaseClient
      .from('budgets')
      .select('*, categories(name), user_id')
      .eq('period', 'monthly')
      .eq('user_id', user.id);

    if (budgetsError) throw budgetsError;

    const alerts = [];

    for (const budget of budgets || []) {
      // Calculate spending for this budget
      const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('amount')
        .eq('user_id', budget.user_id)
        .eq('category_id', budget.category_id)
        .eq('type', 'expense')
        .gte('date', `${currentMonth}-01`);

      const spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const percentage = (spent / Number(budget.amount)) * 100;
      const alertThreshold = Number(budget.alert_threshold) * 100;

      // Check if user has budget alerts enabled
      const budgetAlertsEnabled = true; // This would check localStorage in a real scenario

      if (percentage >= alertThreshold && budgetAlertsEnabled) {
        alerts.push({
          user_id: budget.user_id,
          category: budget.categories?.name,
          spent,
          budget: Number(budget.amount),
          percentage,
          isOverBudget: percentage > 100,
        });
      }
    }

    return new Response(
      JSON.stringify({ alerts, count: alerts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log full error server-side for debugging
    console.error('Error checking budget alerts:', error);
    
    // Return generic message to client
    return new Response(
      JSON.stringify({ 
        error: 'Unable to check budget alerts. Please try again.',
        code: 'BUDGET_CHECK_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


