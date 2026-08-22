import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// City to GeoID mapping
const CITY_GEO_IDS: Record<string, string> = {
  "jerusalem": "281184",
  "ירושלים": "281184",
  "tel aviv": "293397",
  "תל אביב": "293397",
  "haifa": "294801",
  "חיפה": "294801",
  "beersheba": "295530",
  "באר שבע": "295530",
};

const getCityGeoId = (cityName: string): string => {
  const normalized = cityName.toLowerCase().trim();
  return CITY_GEO_IDS[normalized] || "281184";
};

// Fetch Shabbat times
async function getShabbatTimes(city: string = 'Jerusalem') {
  const geoId = getCityGeoId(city);
  const response = await fetch(
    `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on&lg=h`
  );
  const data = await response.json();
  
  const candleLighting = data.items.find((item: any) => item.category === 'candles');
  const havdalah = data.items.find((item: any) => item.category === 'havdalah');
  const parashat = data.items.find((item: any) => item.category === 'parashat');
  
  return {
    city,
    candleLighting: candleLighting?.title || '',
    havdalah: havdalah?.title || '',
    parsha: parashat?.hebrew || parashat?.title || '',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub || claimsData.claims.role !== 'authenticated') {
      console.error('Auth failed in voice-assistant:', claimsError?.message);
      return new Response(JSON.stringify({ error: 'נדרשת התחברות כדי להשתמש בעוזר הקולי' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { message, city } = await req.json();

    // Get current Shabbat times for context
    const shabbatTimes = await getShabbatTimes(city || 'Jerusalem');

    const systemPrompt = `אתה עוזר וירטואלי ידידותי לאפליקציית זמני שבת.
אתה עונה בעברית בצורה חמה ומזמינה.

נתוני שבת הקרובה:
- עיר: ${shabbatTimes.city}
- הדלקת נרות: ${shabbatTimes.candleLighting}
- הבדלה: ${shabbatTimes.havdalah}
- פרשת השבוע: ${shabbatTimes.parsha}

ענה על שאלות בנוגע לזמני שבת, פרשת השבוע, והכנות לשבת.
היה קצר וברור בתשובות שלך.
אם שואלים על זמנים בעיר אחרת, אמור שאתה יכול לספק מידע רק על ${shabbatTimes.city} כרגע.`;

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
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "יותר מדי בקשות, נסה שוב בעוד כמה שניות" 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ 
      response: content,
      shabbatTimes 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in voice-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
