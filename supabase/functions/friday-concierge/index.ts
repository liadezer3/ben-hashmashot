import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const {
      messages = [],
      candleLighting = "",
      havdalah = "",
      parsha = "",
      city = "",
    }: {
      messages: ChatMessage[];
      candleLighting?: string;
      havdalah?: string;
      parsha?: string;
      city?: string;
    } = await req.json();

    const systemPrompt =
      "אתה 'קונסיירז' ערב שבת' – עוזר אישי חם ומעשי שעוזר למשתמשים בישראל לתכנן את יום שישי " +
      "כדי להספיק הכל לפני כניסת השבת. אתה בונה לו\"ז מותאם אישית לפי המשימות שהמשתמש מזכיר, " +
      "מתחשב בזמן כניסת השבת, ונותן טיפים מעשיים (קניות, בישול, מקלחת, הכנת שולחן). " +
      "ענה בעברית, בקצרה וברור, השתמש ברשימות ובשעות מסודרות (Markdown). " +
      `\n\nהקשר לשבת הקרובה:\nעיר: ${city || "לא ידוע"}\nכניסת שבת: ${candleLighting || "לא ידוע"}\n` +
      `צאת שבת: ${havdalah || "לא ידוע"}\nפרשת השבוע: ${parsha || "לא ידוע"}.`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      throw new Error(`AI gateway error ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("friday-concierge error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
