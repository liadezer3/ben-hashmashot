// Shared knowledge tools for the two-way bot (Telegram / WhatsApp).
// All data is read live from the same sources the website uses, so the bot
// always stays in sync with the app.
import { HDate, HebrewCalendar, Location, Zmanim, Sedra } from "npm:@hebcal/core@5";

export interface CityInfo {
  lat: number;
  lon: number;
  tz: string;
  name: string;
}

export const CITY_COORDS: Record<string, CityInfo> = {
  "ירושלים": { lat: 31.7683, lon: 35.2137, tz: "Asia/Jerusalem", name: "ירושלים" },
  "תל אביב": { lat: 32.0853, lon: 34.7818, tz: "Asia/Jerusalem", name: "תל אביב" },
  "חיפה": { lat: 32.794, lon: 34.9896, tz: "Asia/Jerusalem", name: "חיפה" },
  "באר שבע": { lat: 31.2518, lon: 34.7913, tz: "Asia/Jerusalem", name: "באר שבע" },
  "אשדוד": { lat: 31.8014, lon: 34.6435, tz: "Asia/Jerusalem", name: "אשדוד" },
  "נתניה": { lat: 32.3215, lon: 34.8532, tz: "Asia/Jerusalem", name: "נתניה" },
  "פתח תקווה": { lat: 32.0878, lon: 34.8878, tz: "Asia/Jerusalem", name: "פתח תקווה" },
  "ראשון לציון": { lat: 31.9635, lon: 34.8044, tz: "Asia/Jerusalem", name: "ראשון לציון" },
  "רמת גן": { lat: 32.0684, lon: 34.8248, tz: "Asia/Jerusalem", name: "רמת גן" },
  "בני ברק": { lat: 32.0807, lon: 34.8338, tz: "Asia/Jerusalem", name: "בני ברק" },
  "חולון": { lat: 32.0117, lon: 34.7745, tz: "Asia/Jerusalem", name: "חולון" },
  "בת ים": { lat: 32.0171, lon: 34.7457, tz: "Asia/Jerusalem", name: "בת ים" },
  "רחובות": { lat: 31.8928, lon: 34.8113, tz: "Asia/Jerusalem", name: "רחובות" },
  "מודיעין": { lat: 31.8928, lon: 35.0104, tz: "Asia/Jerusalem", name: "מודיעין" },
  "אשקלון": { lat: 31.6688, lon: 34.5742, tz: "Asia/Jerusalem", name: "אשקלון" },
  "כפר סבא": { lat: 32.1782, lon: 34.9077, tz: "Asia/Jerusalem", name: "כפר סבא" },
  "הרצליה": { lat: 32.1624, lon: 34.8447, tz: "Asia/Jerusalem", name: "הרצליה" },
  "רעננה": { lat: 32.1848, lon: 34.8713, tz: "Asia/Jerusalem", name: "רעננה" },
  "צפת": { lat: 32.9646, lon: 35.496, tz: "Asia/Jerusalem", name: "צפת" },
  "טבריה": { lat: 32.7922, lon: 35.5312, tz: "Asia/Jerusalem", name: "טבריה" },
  "אילת": { lat: 29.5577, lon: 34.9519, tz: "Asia/Jerusalem", name: "אילת" },
  "נצרת": { lat: 32.6996, lon: 35.3035, tz: "Asia/Jerusalem", name: "נצרת" },
  "עפולה": { lat: 32.6078, lon: 35.2897, tz: "Asia/Jerusalem", name: "עפולה" },
  "בית שמש": { lat: 31.7497, lon: 34.9887, tz: "Asia/Jerusalem", name: "בית שמש" },
  "אריאל": { lat: 32.1056, lon: 35.1714, tz: "Asia/Jerusalem", name: "אריאל" },
};

const ALIASES: Record<string, string> = {
  jerusalem: "ירושלים",
  "tel aviv": "תל אביב",
  telaviv: "תל אביב",
  haifa: "חיפה",
  "beer sheva": "באר שבע",
  beersheba: "באר שבע",
  ashdod: "אשדוד",
  netanya: "נתניה",
  eilat: "אילת",
  "י-ם": "ירושלים",
  "ת\"א": "תל אביב",
  תא: "תל אביב",
};

export function resolveCity(input?: string | null): CityInfo {
  if (!input) return CITY_COORDS["ירושלים"];
  const raw = String(input).trim();
  if (CITY_COORDS[raw]) return CITY_COORDS[raw];
  const lower = raw.toLowerCase();
  if (ALIASES[lower] && CITY_COORDS[ALIASES[lower]]) return CITY_COORDS[ALIASES[lower]];
  const partial = Object.keys(CITY_COORDS).find((c) => c.includes(raw) || raw.includes(c));
  if (partial) return CITY_COORDS[partial];
  return CITY_COORDS["ירושלים"];
}

function makeLocation(city: CityInfo) {
  return new Location(city.lat, city.lon, true, city.tz, city.name, "IL");
}

function fmtTime(d?: Date | null, tz = "Asia/Jerusalem"): string | null {
  if (!d || isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
    hour12: false,
  }).format(d);
}

function fmtDate(d: Date, tz = "Asia/Jerusalem"): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(d);
}

function nextFriday(from = new Date()): Date {
  const d = new Date(from);
  const day = d.getDay(); // 0 Sun .. 5 Fri, 6 Sat
  let add = (5 - day + 7) % 7;
  if (day === 6) add = 6; // Saturday -> next Friday
  d.setDate(d.getDate() + add);
  return d;
}

/** Shabbat entry/exit times for a city, with candle-lighting offset. */
export function getShabbatTimes(cityName?: string, candleMinutesBefore = 18, havdalahMinutes = 42) {
  const city = resolveCity(cityName);
  const loc = makeLocation(city);
  const friday = nextFriday();
  const saturday = new Date(friday);
  saturday.setDate(saturday.getDate() + 1);

  const zF = new Zmanim(loc, friday, false);
  const zS = new Zmanim(loc, saturday, false);

  const sunsetFri = zF.sunset();
  const candle = new Date(sunsetFri.getTime() - candleMinutesBefore * 60000);
  const sunsetSat = zS.sunset();
  const havdalah = new Date(sunsetSat.getTime() + havdalahMinutes * 60000);

  const hd = new HDate(saturday);
  const sedra = new Sedra(hd.getFullYear(), true);
  let parsha = "";
  try {
    parsha = sedra.getString(hd, "he");
  } catch {
    parsha = "";
  }

  return {
    city: city.name,
    fridayDate: fmtDate(friday, city.tz),
    saturdayDate: fmtDate(saturday, city.tz),
    candleLighting: fmtTime(candle, city.tz),
    sunsetFriday: fmtTime(sunsetFri, city.tz),
    havdalah: fmtTime(havdalah, city.tz),
    candleMinutesBefore,
    havdalahMinutes,
    parsha,
    hebrewDate: hd.renderGematriya(true),
  };
}

/** Daily halachic times (zmanim) for a city. */
export function getDailyHalachicTimes(cityName?: string, dateStr?: string) {
  const city = resolveCity(cityName);
  const loc = makeLocation(city);
  const date = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(date.getTime())) throw new Error("INVALID_DATE");
  const z = new Zmanim(loc, date, false);
  const hd = new HDate(date);

  return {
    city: city.name,
    date: fmtDate(date, city.tz),
    hebrewDate: hd.renderGematriya(true),
    alotHaShachar: fmtTime(z.alotHaShachar(), city.tz),
    misheyakir: fmtTime(z.misheyakir(), city.tz),
    sunrise: fmtTime(z.sunrise(), city.tz),
    sofZmanShma: fmtTime(z.sofZmanShma(), city.tz),
    sofZmanTfilla: fmtTime(z.sofZmanTfilla(), city.tz),
    chatzot: fmtTime(z.chatzot(), city.tz),
    minchaGedola: fmtTime(z.minchaGedola(), city.tz),
    minchaKetana: fmtTime(z.minchaKetana(), city.tz),
    plagHaMincha: fmtTime(z.plagHaMincha(), city.tz),
    sunset: fmtTime(z.sunset(), city.tz),
    tzeit: fmtTime(z.tzeit(8.5), city.tz),
  };
}

/** Current parsha, upcoming holidays, Omer count. */
export function getParshaAndHolidays() {
  const now = new Date();
  const saturday = nextFriday();
  saturday.setDate(saturday.getDate() + 1);
  const hd = new HDate(saturday);
  const sedra = new Sedra(hd.getFullYear(), true);
  let parsha = "";
  try {
    parsha = sedra.getString(hd, "he");
  } catch {
    parsha = "";
  }

  const end = new Date(now);
  end.setDate(end.getDate() + 90);
  const events = HebrewCalendar.calendar({
    start: now,
    end,
    il: true,
    locale: "he",
    sedrot: false,
    candlelighting: false,
    omer: true,
  });

  const holidays: { name: string; date: string }[] = [];
  let omer: string | null = null;
  for (const ev of events) {
    const desc = ev.render("he");
    const d = ev.getDate().greg();
    if (desc.includes("בעומר") || desc.includes("עומר")) {
      if (!omer && d.toDateString() === now.toDateString()) omer = desc;
      continue;
    }
    if (holidays.length < 12) {
      holidays.push({ name: desc, date: fmtDate(d) });
    }
  }

  return {
    todayHebrewDate: new HDate(now).renderGematriya(true),
    parsha,
    omerToday: omer,
    upcomingHolidays: holidays,
  };
}

/** Daily learning content from Sefaria. */
export async function getSefariaDaily() {
  try {
    const res = await fetch("https://www.sefaria.org/api/calendars?diaspora=0");
    if (!res.ok) return { error: `Sefaria ${res.status}` };
    const data = await res.json();
    const items = (data.calendar_items ?? []).map((i: any) => ({
      title: i.title?.he ?? i.title?.en,
      ref: i.displayValue?.he ?? i.displayValue?.en,
      category: i.category,
    }));
    return { date: data.date, items };
  } catch (e) {
    return { error: String(e) };
  }
}

const APP_INFO: Record<string, string> = {
  general:
    "אפליקציית 'בין השמשות' עוזרת למשפחות בישראל להתכונן לשבת: זמני כניסת ויציאת שבת מדויקים לפי עיר, " +
    "זמני הלכה יומיים, פרשת השבוע, התראות אוטומטיות בכמה ערוצים, ניהול משפחתי משותף ותוכן תורני. " +
    "האפליקציה מותאמת לרמת השומרות של המשתמש (דתי / מסורתי / חילוני) וזמינה בעברית ובאנגלית, כאפליקציה נטיבית וכ-PWA.",
  features:
    "פיצ'רים מרכזיים: זמני שבת לפי עיר ומיקום; זמני הלכה יומיים; פרשת השבוע עם תוכן AI מותאם קהל (ילדים / עסקי / שולחן שבת); " +
    "התראות אוטומטיות בוואטסאפ, טלגרם, אימייל, SMS, פוש והתראות מקומיות; קונסיירז' ערב שבת (תכנון יום שישי עם AI); " +
    "המלצת זמן יציאה חכמה עם מזג אוויר; ניווט הביתה בוויז/גוגל מפות עם ספירה לאחור; קבוצות משפחה משותפות; " +
    "רשימת קניות משותפת בזמן אמת; הזמנות אורחים ו-RSVP עם פוטלאק; זכרונות ומתכונים משפחתיים; " +
    "מדד 'שבת שלום' ודירוגים; מעקב הדלקת נרות; ספירת העומר; יומני חגים וימי זיכרון; " +
    "מוזיקת שבת דינמית; אוטומציית בית חכם (Philips Hue / Home Assistant); מציאת בתי כנסת; " +
    "סנכרון יומן (Google/Apple) והזנת ICS; מצב אופליין לשבת; עוזר קולי; ווידג'ט למסך הבית.",
  notifications:
    "ניתן להפעיל התראות בערוצים: וואטסאפ, טלגרם, אימייל, SMS, פוש (Web Push) והתראות מקומיות במכשיר. " +
    "לכל ערוץ ניתן לקבוע תדירות (שבועי/יומי), שעת שליחה בבוקר, כמה ימים לפני שבת ושעת תזכורת. " +
    "ההגדרות נמצאות במסך ההגדרות תחת 'התראות'.",
  privacy:
    "מדיניות הפרטיות זמינה בדף /privacy, ותנאי השימוש בדף /terms. הנתונים מאובטחים ומוגנים ב-RLS, " +
    "וכל משתמש רואה רק את הנתונים שלו או של קבוצת המשפחה שלו.",
  contact:
    "ליצירת קשר: ליעד עזר — וואטסאפ/טלפון +972-50-915-1878, אימייל liadezer3@gmail.com. " +
    "האתר: https://ben-hashmashot.lovable.app",
  pages:
    "דפים באפליקציה: / (מסך ראשי), /dashboard (תובנות וסטטיסטיקות), /settings (הגדרות והתראות), " +
    "/profile (פרופיל), /widget (ווידג'ט מינימלי אופליין), /privacy, /terms, /invite/:code (דף הזמנה לשבת).",
};

export function getAppInfo(topic?: string) {
  const key = (topic ?? "general").toLowerCase();
  if (APP_INFO[key]) return { topic: key, info: APP_INFO[key] };
  return { topic: "all", info: Object.values(APP_INFO).join("\n\n") };
}

/** Personal data for a linked user. Requires a service-role supabase client. */
export async function getMyData(supabase: any, userId: string, kind: string) {
  switch (kind) {
    case "shopping_list": {
      const { data: groups } = await supabase
        .from("family_group_members")
        .select("group_id")
        .eq("user_id", userId);
      const ids = (groups ?? []).map((g: any) => g.group_id);
      if (!ids.length) return { items: [], note: "אין קבוצת משפחה מקושרת" };
      const { data } = await supabase
        .from("shopping_list_items")
        .select("title, quantity, category, is_purchased")
        .in("group_id", ids)
        .order("created_at", { ascending: false })
        .limit(80);
      return { items: data ?? [] };
    }
    case "tasks": {
      const { data } = await supabase
        .from("shabbat_tasks")
        .select("title, is_completed")
        .eq("user_id", userId)
        .order("sort_order")
        .limit(80);
      return { tasks: data ?? [] };
    }
    case "guests": {
      const { data: invites } = await supabase
        .from("shabbat_invitations")
        .select("id, shabbat_date, host_name, address, max_guests")
        .eq("user_id", userId)
        .order("shabbat_date", { ascending: false })
        .limit(3);
      const ids = (invites ?? []).map((i: any) => i.id);
      let guests: any[] = [];
      if (ids.length) {
        const { data } = await supabase
          .from("invitation_guests")
          .select("invitation_id, guest_name, status, dish_to_bring")
          .in("invitation_id", ids)
          .limit(120);
        guests = data ?? [];
      }
      return { invitations: invites ?? [], guests };
    }
    case "family_group": {
      const { data } = await supabase
        .from("family_group_members")
        .select("display_name, role, group_id, family_groups(name, invite_code)")
        .eq("user_id", userId);
      return { memberships: data ?? [] };
    }
    case "profile": {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, city")
        .eq("id", userId)
        .maybeSingle();
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("observance_level, language, minhag, zmanim_preset, timezone, location")
        .eq("user_id", userId)
        .maybeSingle();
      return { profile: profile ?? null, preferences: prefs ?? null };
    }
    case "events": {
      const { data } = await supabase
        .from("family_events")
        .select("title, event_type, event_date, hebrew_date, notes")
        .eq("user_id", userId)
        .order("event_date")
        .limit(50);
      return { events: data ?? [] };
    }
    case "ratings": {
      const { data } = await supabase
        .from("shabbat_ratings")
        .select("rating, shabbat_date, parsha, notes")
        .eq("user_id", userId)
        .order("shabbat_date", { ascending: false })
        .limit(20);
      return { ratings: data ?? [] };
    }
    default:
      return { error: "UNKNOWN_KIND" };
  }
}

export async function getMyNotificationSettings(supabase: any, userId: string) {
  const { data } = await supabase
    .from("notification_preferences")
    .select(
      "email_enabled, whatsapp_enabled, telegram_enabled, push_enabled, sms_enabled, " +
        "email_frequency, whatsapp_frequency, telegram_frequency, push_frequency, sms_frequency, " +
        "morning_time, hours_before_shabbat, custom_message",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return { settings: data ?? null };
}

/** Preferred city for a linked user (falls back to Jerusalem). */
export async function getUserCity(supabase: any, userId: string | null): Promise<string> {
  if (!userId) return "ירושלים";
  const { data: loc } = await supabase
    .from("saved_locations")
    .select("city")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();
  if (loc?.city) return loc.city;
  const { data: profile } = await supabase
    .from("profiles")
    .select("city")
    .eq("id", userId)
    .maybeSingle();
  return profile?.city || "ירושלים";
}
