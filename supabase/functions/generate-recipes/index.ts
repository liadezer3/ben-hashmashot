import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { guestCount, dietary, mealType } = await req.json();

    const mealLabels: Record<string, string> = {
      "friday-dinner": "סעודת ליל שבת",
      "saturday-lunch": "סעודת שבת בצהריים",
      "seuda-shlishit": "סעודה שלישית",
      "kiddush": "קידוש",
    };

    const dietaryLabels: Record<string, string> = {
      "regular": "רגיל (כשר)",
      "gluten-free": "ללא גלוטן",
      "vegetarian": "צמחוני",
      "vegan": "טבעוני",
      "low-carb": "דל פחמימות",
    };

    const prompt = `הצע 3-4 מתכונים מגוונים ל${mealLabels[mealType] || mealType} לשבת.
מספר סועדים: ${guestCount}
תזונה: ${dietaryLabels[dietary] || dietary}

לכל מתכון כלול: שם, תיאור קצר, רשימת מצרכים עם כמויות מותאמות ל-${guestCount} סועדים, זמן הכנה, ואימוג'י מתאים.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "אתה שף ישראלי מומחה למטבח שבת. החזר JSON בלבד." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_recipes",
            description: "Return Shabbat recipe suggestions",
            parameters: {
              type: "object",
              properties: {
                recipes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      servings: { type: "number" },
                      prepTime: { type: "string" },
                      emoji: { type: "string" },
                    },
                    required: ["name", "description", "ingredients", "servings", "prepTime", "emoji"],
                  },
                },
              },
              required: ["recipes"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_recipes" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let recipes = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      recipes = parsed.recipes || [];
    }

    return new Response(JSON.stringify({ recipes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate recipes error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
