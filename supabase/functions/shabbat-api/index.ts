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
  "netanya": "293100",
  "נתניה": "293100",
  "bnei brak": "295432",
  "בני ברק": "295432",
  "ramat gan": "293703",
  "רמת גן": "293703",
  "ashdod": "295629",
  "אשדוד": "295629",
  "petah tikva": "293703",
  "פתח תקווה": "293703",
};

const getCityGeoId = (cityName: string): string => {
  const normalized = cityName.toLowerCase().trim();
  return CITY_GEO_IDS[normalized] || "281184"; // Default to Jerusalem
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const city = url.searchParams.get('city') || 'Jerusalem';
    const format = url.searchParams.get('format') || 'json'; // json or text
    
    const geoId = getCityGeoId(city);
    
    // Fetch from Hebcal API
    const hebcalResponse = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on&lg=h`
    );
    
    if (!hebcalResponse.ok) {
      throw new Error('Failed to fetch Shabbat times');
    }
    
    const data = await hebcalResponse.json();
    
    // Parse the data
    const candleLighting = data.items.find((item: any) => item.category === 'candles');
    const havdalah = data.items.find((item: any) => item.category === 'havdalah');
    const parashat = data.items.find((item: any) => item.category === 'parashat');
    
    // Format date for Shabbat entry
    let shabbatDate = '';
    let candleLightingTime = '';
    let havdalahTime = '';
    
    if (candleLighting?.date) {
      const candleDate = new Date(candleLighting.date);
      shabbatDate = candleDate.toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      candleLightingTime = candleLighting.title || '';
    }
    
    if (havdalah?.title) {
      havdalahTime = havdalah.title;
    }
    
    const result = {
      city,
      shabbatDate,
      candleLighting: candleLightingTime,
      havdalah: havdalahTime,
      parsha: parashat?.hebrew || parashat?.title || '',
      parshaEnglish: parashat?.title || '',
      hebrewDate: data.date || '',
      location: data.location || {},
    };
    
    // Return text format for voice/ChatGPT
    if (format === 'text') {
      const textResponse = `זמני שבת ב${city}:
📅 ${shabbatDate}
📖 פרשת ${result.parsha}
🕯️ הדלקת נרות: ${candleLightingTime}
🌃 הבדלה: ${havdalahTime}

שבת שלום! ✨`;
      
      return new Response(textResponse, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in shabbat-api:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
