import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { israelZmanimParams } from "../_shared/israelZmanim.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map of common city names -> Hebcal geonameid
const CITY_GEO: Record<string, string> = {
  jerusalem: "281184", "ירושלים": "281184",
  "tel aviv": "293397", "תל אביב": "293397",
  haifa: "294801", "חיפה": "294801",
  beersheba: "295530", "באר שבע": "295530",
  netanya: "293100", "נתניה": "293100",
  "bnei brak": "295432", "בני ברק": "295432",
  "ramat gan": "293703", "רמת גן": "293703",
  ashdod: "295629", "אשדוד": "295629",
  "petah tikva": "293918", "פתח תקווה": "293918",
  "rishon lezion": "293807", "ראשון לציון": "293807",
  modiin: "282926", "מודיעין": "282926",
  eilat: "295277", "אילת": "295277",
};

const geoIdFor = (city: string): string => {
  const key = city.trim().toLowerCase();
  return CITY_GEO[key] || CITY_GEO[city.trim()] || "281184";
};

const pad = (n: number) => n.toString().padStart(2, "0");

const toICalUtc = (d: Date): string =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const esc = (s: string) => s.replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const city = url.searchParams.get("city") || "Jerusalem";
    const geoId = geoIdFor(city);

    // Fetch 12 months of Shabbat + holiday candle-lighting / havdalah times.
    const now = new Date();
    const hebcalUrl =
      `https://www.hebcal.com/hebcal?v=1&cfg=json&geonameid=${geoId}${israelZmanimParams(city)}` +
      `&maj=on&min=off&mod=off&nx=off&year=now&month=x&ss=on&mf=on&c=on&b=18&M=on&s=on&lg=h`;

    const res = await fetch(hebcalUrl);
    if (!res.ok) throw new Error(`Hebcal error ${res.status}`);
    const data = await res.json();

    const items: any[] = data.items || [];
    const stamp = toICalUtc(now);

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ben Hashmashot//Shabbat Feed//HE",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${esc("זמני שבת - " + city)}`,
      "X-WR-TIMEZONE:Asia/Jerusalem",
      "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
      "X-PUBLISHED-TTL:PT12H",
    ];

    // Pair candle-lighting with the next havdalah to create block events.
    const candles = items.filter((i) => i.category === "candles");
    for (const c of candles) {
      const start = new Date(c.date);
      // find matching havdalah after this candle-lighting (within 3 days)
      const hav = items.find(
        (i) =>
          i.category === "havdalah" &&
          new Date(i.date).getTime() > start.getTime() &&
          new Date(i.date).getTime() - start.getTime() < 1000 * 60 * 60 * 72
      );
      const end = hav ? new Date(hav.date) : new Date(start.getTime() + 25 * 60 * 60 * 1000);
      const uid = `${toICalUtc(start)}-shabbat@ben-hashmashot`;
      const summary = `🕯️ ${c.title || "כניסת שבת"}`;
      const desc = hav ? `הבדלה: ${hav.title}` : "";

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${toICalUtc(start)}`,
        `DTEND:${toICalUtc(end)}`,
        `SUMMARY:${esc(summary)}`,
        `DESCRIPTION:${esc(desc)}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${esc("כניסת שבת מתקרבת")}`,
        "TRIGGER:-PT30M",
        "END:VALARM",
        "END:VEVENT"
      );
    }

    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");

    return new Response(ics, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="shabbat.ics"',
        "Cache-Control": "public, max-age=43200",
      },
    });
  } catch (err) {
    console.error("calendar-feed error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
