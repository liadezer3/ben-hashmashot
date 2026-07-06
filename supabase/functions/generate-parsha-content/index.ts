import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { parsha, audience = "general" } = await req.json();

    const audienceProfiles: Record<string, { system: string; user: string }> = {
      kids: {
        system: `אתה מספר סיפורים תורני לילדים. כתוב בעברית פשוטה, חמה ומלאת דמיון, עם משל קצר וברור שילדים אוהבים.`,
        user: `כתוב סיפור/דבר תורה לילדים על פרשת ${parsha || "השבוע"}.
כלול: סיפור קצר וקולח מהפרשה, מסר פשוט לילדים, ושאלה קטנה להורים לשאול סביב השולחן.
אורך: כ-120-150 מילים. שפה מתאימה לגילאי 5-10.`,
      },
      business: {
        system: `אתה יועץ ומרצה שמחבר בין חוכמת התורה לעולם העסקים והמנהיגות. כתוב בעברית מקצועית ונגישה.`,
        user: `כתוב תובנה עסקית/ניהולית מפרשת ${parsha || "השבוע"}.
כלול: רעיון מרכזי מהפרשה, לקח מעשי למנהיגות/עסקים/החלטות, ומשפט השראה לסיום.
אורך: כ-150-180 מילים.`,
      },
      table: {
        system: `אתה מכין "נקודה לשולחן שבת" - קצרה, מעוררת שיחה וחמה. כתוב בעברית נגישה.`,
        user: `כתוב נקודת מחשבה קצרה לשולחן השבת על פרשת ${parsha || "השבוע"}.
כלול: רעיון אחד חד וברור, ושאלה פתוחה שתעורר שיחה משפחתית.
אורך: כ-80-120 מילים בלבד.`,
      },
      general: {
        system: `אתה רב וסופר תורני מומחה. תפקידך לכתוב תוכן תורני עשיר ומרתק בעברית.
כתוב בסגנון חם, מעורר השראה ונגיש לכל קורא.
התוכן צריך להיות רלוונטי לחיי היום-יום ולאקטואליה.`,
        user: `כתוב דבר תורה קצר ומרתק על פרשת ${parsha || "השבוע"}.
הדבר תורה צריך לכלול:
1. סיכום קצר של הפרשה (2-3 משפטים)
2. רעיון מרכזי או מסר מהפרשה
3. כיצד הנושא מתקשר לחיינו היום ולאקטואליה העכשווית
4. משפט השראה לסיום

אורך הטקסט: כ-150-200 מילים.
כתוב בעברית יפה ונגישה.`,
      },
    };

    const profile = audienceProfiles[audience] || audienceProfiles.general;
    const systemPrompt = profile.system;
    const userPrompt = profile.user;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ content, parsha }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating parsha content:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
