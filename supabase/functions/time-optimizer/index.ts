import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  jerusalem: { lat: 31.7683, lon: 35.2137 }, "ירושלים": { lat: 31.7683, lon: 35.2137 },
  "tel aviv": { lat: 32.0853, lon: 34.7818 }, "תל אביב": { lat: 32.0853, lon: 34.7818 },
  haifa: { lat: 32.794, lon: 34.9896 }, "חיפה": { lat: 32.794, lon: 34.9896 },
  beersheba: { lat: 31.2518, lon: 34.7913 }, "באר שבע": { lat: 31.2518, lon: 34.7913 },
  netanya: { lat: 32.3215, lon: 34.8532 }, "נתניה": { lat: 32.3215, lon: 34.8532 },
  ashdod: { lat: 31.8044, lon: 34.6553 }, "אשדוד": { lat: 31.8044, lon: 34.6553 },
};

const coordsFor = (city: string) => {
  const k = city.trim().toLowerCase();
  return CITY_COORDS[k] || CITY_COORDS[city.trim()] || CITY_COORDS.jerusalem;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { city = "ירושלים", candleLighting = "" } = await req.json();
    const { lat, lon } = coordsFor(city);

    // Fetch today's weather (Open-Meteo, no key required)
    let weatherSummary = "לא זמין";
    try {
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,precipitation,weather_code,wind_speed_10m` +
          `&daily=precipitation_probability_max,temperature_2m_max&timezone=Asia%2FJerusalem&forecast_days=1`
      );
      if (wRes.ok) {
        const w = await wRes.json();
        const cur = w.current || {};
        const daily = w.daily || {};
        weatherSummary =
          `טמפ' נוכחית ${cur.temperature_2m}°, מקס' ${daily.temperature_2m_max?.[0]}°, ` +
          `רוח ${cur.wind_speed_10m} קמ"ש, סיכוי משקעים ${daily.precipitation_probability_max?.[0]}%`;
      }
    } catch (_) {
      // ignore weather failures
    }

    const systemPrompt =
      'אתה עוזר חכם לתכנון ערב שבת בישראל. תפקידך להמליץ על "חלון זמן אופטימלי" ' +
      "להתארגנות וליציאה מהעבודה לפני כניסת השבת, בהתחשב במזג האוויר ובעומסי תנועה אופייניים ביום שישי. " +
      "החזר המלצה קצרה, חמה ומעשית בעברית (2-3 משפטים בלבד). ציין המלצה ברורה בכמה דקות להקדים.";

    const userPrompt =
      `עיר: ${city}\nזמן כניסת שבת: ${candleLighting || "לא ידוע"}\n` +
      `מזג אוויר להיום: ${weatherSummary}\n` +
      "היום יום שישי. תן המלצה מותאמת.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ recommendation, weather: weatherSummary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("time-optimizer error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
