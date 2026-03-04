import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Not authenticated");

    // Fetch user's data for AI analysis
    const [ratingsRes, tasksRes, memoriesRes, prefsRes] = await Promise.all([
      supabase.from("shabbat_ratings").select("rating, shabbat_date, parsha, notes")
        .eq("user_id", user.id).order("shabbat_date", { ascending: false }).limit(20),
      supabase.from("shabbat_tasks").select("title, is_completed")
        .eq("user_id", user.id).limit(30),
      supabase.from("family_memories").select("type, title, date, parsha")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("user_preferences").select("observance_level, language")
        .eq("user_id", user.id).single(),
    ]);

    const ratings = ratingsRes.data || [];
    const tasks = tasksRes.data || [];
    const memories = memoriesRes.data || [];
    const prefs = prefsRes.data;

    const dayOfWeek = new Date().getDay();
    const dayName = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"][dayOfWeek];

    const prompt = `אתה עוזר אישי לשבת. נתח את הנתונים הבאים של המשתמש ותן 3-4 תזכורות חכמות ומותאמות אישית.

היום: יום ${dayName}
רמת שמירה: ${prefs?.observance_level || "traditional"}

דירוגי שבתות אחרונים (${ratings.length}):
${ratings.slice(0, 10).map(r => `${r.shabbat_date}: ${r.rating}/5 ${r.parsha ? `(${r.parsha})` : ""} ${r.notes || ""}`).join("\n")}

משימות (${tasks.length} סה"כ, ${tasks.filter(t => t.is_completed).length} הושלמו):
${tasks.slice(0, 10).map(t => `${t.is_completed ? "✅" : "⬜"} ${t.title}`).join("\n")}

זכרונות אחרונים: ${memories.length} (סוגים: ${[...new Set(memories.map(m => m.type))].join(", ")})

תן בדיוק 3-4 תזכורות בפורמט JSON:
[{"text": "...", "type": "task|habit|tip", "emoji": "..."}]

התזכורות צריכות להיות:
- מבוססות על דפוסים (למשל: "בדרך כלל אתה מדרג גבוה כשיש פרשת X")
- מתוזמנות ליום הנוכחי (אם יום שישי - תזכורות הכנה, אם ראשון - תכנון)
- אישיות ומעודדות
- בעברית`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "תמיד החזר JSON תקין בלבד. ללא טקסט נוסף." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_reminders",
            description: "Return personalized smart reminders",
            parameters: {
              type: "object",
              properties: {
                reminders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      type: { type: "string", enum: ["task", "habit", "tip"] },
                      emoji: { type: "string" },
                    },
                    required: ["text", "type", "emoji"],
                  },
                },
              },
              required: ["reminders"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_reminders" } },
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
    let reminders = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      reminders = parsed.reminders || [];
    }

    return new Response(JSON.stringify({ reminders }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Smart reminders error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
