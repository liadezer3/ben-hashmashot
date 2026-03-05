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

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Not authenticated");

    // Fetch last week's data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 8);
    const weekAgoStr = oneWeekAgo.toISOString();

    const [ratingsRes, memoriesRes, tasksRes] = await Promise.all([
      supabase.from("shabbat_ratings").select("rating, shabbat_date, parsha, notes")
        .eq("user_id", user.id).gte("created_at", weekAgoStr).limit(5),
      supabase.from("family_memories").select("title, type, content, parsha")
        .eq("user_id", user.id).gte("created_at", weekAgoStr).limit(10),
      supabase.from("shabbat_tasks").select("title, is_completed")
        .eq("user_id", user.id).limit(20),
    ]);

    const ratings = ratingsRes.data || [];
    const memories = memoriesRes.data || [];
    const tasks = tasksRes.data || [];

    const prompt = `צור סיכום שבוע חם ואישי בעברית על סמך הנתונים:

דירוגי שבת: ${ratings.map(r => `${r.shabbat_date}: ${r.rating}/5 ${r.parsha || ""} ${r.notes || ""}`).join("; ") || "אין"}

זכרונות שנשמרו: ${memories.map(m => `${m.title} (${m.type})`).join(", ") || "אין"}

משימות: ${tasks.filter(t => t.is_completed).length}/${tasks.length} הושלמו

כתוב סיכום של 100-150 מילים שכולל:
1. סיכום חוויית השבת האחרונה
2. הישג או נקודת אור
3. הצעה לשבת הבאה
4. משפט מעודד לסיום

כתוב בגוף ראשון כאילו אתה חבר של המשתמש.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "אתה עוזר אישי חם ואמפתי שמסכם את השבוע של המשתמש. כתוב בעברית טבעית." },
          { role: "user", content: prompt },
        ],
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
    const summary = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Shabbat summary error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
