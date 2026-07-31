import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { transcript } = await req.json();
    
    if (typeof transcript !== "string" || transcript.trim().length === 0 || transcript.length > 1_000) {
      return new Response(JSON.stringify({ error: 'A transcript between 1 and 1000 characters is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

const prompt = `You are an expert at parsing natural language financial transactions from voice input. Parse this voice input carefully:

Voice input: ${JSON.stringify(transcript.trim())}

IMPORTANT PARSING RULES:
1. AMOUNT DETECTION:
   - Look for numbers in any format: "1000", "1,000", "one thousand", "1k", "fifty", "hundred"
   - Handle Indian number words: "lakh", "crore", "hazaar/hazar" (thousand)
   - Handle currency mentions: "rupees", "rs", "â‚¹", "INR"
   - If someone says "one fifty" they likely mean 150

2. TRANSACTION TYPE:
   - EXPENSE keywords: spent, paid, bought, purchased, expense, cost, charged, deducted, given, payment
   - INCOME keywords: received, got, earned, salary, income, credited, refund, cashback, bonus, payment received
   - Default to "expense" if unclear

3. TITLE EXTRACTION:
   - Extract the main subject/item of the transaction
   - Keep it concise (2-5 words max)
   - Remove filler words like "um", "uh", "like", "so"

4. CATEGORY SUGGESTION (choose the most appropriate):
   - Salary, Investment, Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Groceries, Personal Care, Gifts

Return ONLY valid JSON (no markdown, no explanation):
{
  "title": "concise transaction title",
  "amount": "numeric amount as string without symbols",
  "type": "income" or "expense",
  "description": "original input cleaned up",
  "suggestedCategory": "best matching category"
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
          { role: "system", content: "You are a transaction parser. Return ONLY valid JSON, no markdown or explanation." },
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
    let parsedData;
    
    try {
      const content = aiData.choices[0].message.content;
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Basic fallback parsing
      const amountMatch = transcript.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      parsedData = {
        title: transcript.slice(0, 50),
        amount: amountMatch ? amountMatch[1].replace(/,/g, '') : '',
        type: /(?:spent|paid|bought)/i.test(transcript) ? 'expense' : 'expense',
        description: transcript,
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-voice-transaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});



