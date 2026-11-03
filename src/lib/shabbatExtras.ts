// Shared logic for the Friday timeline, table trivia and world Shabbat times.
import { HebrewCalendar, Location } from "@hebcal/core";

export interface WorldCity {
  slug: string;
  he: string;
  lat: number;
  lon: number;
  tz: string;
  cc: string;
}

/** Common destinations for Israeli travellers. Candle lighting abroad: 18 min before sunset. */
export const WORLD_CITIES: WorldCity[] = [
  { slug: "new-york", he: "ניו יורק", lat: 40.7128, lon: -74.006, tz: "America/New_York", cc: "US" },
  { slug: "miami", he: "מיאמי", lat: 25.7617, lon: -80.1918, tz: "America/New_York", cc: "US" },
  { slug: "los-angeles", he: "לוס אנג'לס", lat: 34.0522, lon: -118.2437, tz: "America/Los_Angeles", cc: "US" },
  { slug: "london", he: "לונדון", lat: 51.5074, lon: -0.1278, tz: "Europe/London", cc: "GB" },
  { slug: "paris", he: "פריז", lat: 48.8566, lon: 2.3522, tz: "Europe/Paris", cc: "FR" },
  { slug: "rome", he: "רומא", lat: 41.9028, lon: 12.4964, tz: "Europe/Rome", cc: "IT" },
  { slug: "berlin", he: "ברלין", lat: 52.52, lon: 13.405, tz: "Europe/Berlin", cc: "DE" },
  { slug: "amsterdam", he: "אמסטרדם", lat: 52.3676, lon: 4.9041, tz: "Europe/Amsterdam", cc: "NL" },
  { slug: "prague", he: "פראג", lat: 50.0755, lon: 14.4378, tz: "Europe/Prague", cc: "CZ" },
  { slug: "budapest", he: "בודפשט", lat: 47.4979, lon: 19.0402, tz: "Europe/Budapest", cc: "HU" },
  { slug: "athens", he: "אתונה", lat: 37.9838, lon: 23.7275, tz: "Europe/Athens", cc: "GR" },
  { slug: "larnaca", he: "לרנקה", lat: 34.9003, lon: 33.6232, tz: "Asia/Nicosia", cc: "CY" },
  { slug: "dubai", he: "דובאי", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai", cc: "AE" },
  { slug: "bangkok", he: "בנגקוק", lat: 13.7563, lon: 100.5018, tz: "Asia/Bangkok", cc: "TH" },
  { slug: "delhi", he: "ניו דלהי", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata", cc: "IN" },
  { slug: "moscow", he: "מוסקבה", lat: 55.7558, lon: 37.6173, tz: "Europe/Moscow", cc: "RU" },
  { slug: "buenos-aires", he: "בואנוס איירס", lat: -34.6037, lon: -58.3816, tz: "America/Argentina/Buenos_Aires", cc: "AR" },
  { slug: "toronto", he: "טורונטו", lat: 43.6532, lon: -79.3832, tz: "America/Toronto", cc: "CA" },
  { slug: "melbourne", he: "מלבורן", lat: -37.8136, lon: 144.9631, tz: "Australia/Melbourne", cc: "AU" },
  { slug: "johannesburg", he: "יוהנסבורג", lat: -26.2041, lon: 28.0473, tz: "Africa/Johannesburg", cc: "ZA" },
];

const fmt = (d: Date | null | undefined, tz: string) =>
  d ? new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(d) : "--:--";

export interface WorldTimes {
  candle: string;
  havdalah: string;
  parsha: string;
  dateLabel: string;
}

/** Diaspora calendar (il:false), 18 min candle lighting, havdalah at 8.5°. */
export const getWorldShabbatTimes = (city: WorldCity, now: Date = new Date()): WorldTimes => {
  const loc = new Location(city.lat, city.lon, false, city.tz, city.he, city.cc);
  const events = HebrewCalendar.calendar({
    start: new Date(now.getTime() - 86400000),
    end: new Date(now.getTime() + 9 * 86400000),
    location: loc,
    il: false,
    candlelighting: true,
    candleLightingMins: 18,
    havdalahDeg: 8.5,
    sedrot: true,
    locale: "he",
  });
  const after = (desc: string) =>
    events.find((e: any) => e.getDesc() === desc && e.eventTime && e.eventTime.getTime() > now.getTime()) as any;
  const c = after("Candle lighting");
  const h = after("Havdalah");
  const p = events.find((e) => e.getDesc().startsWith("Parashat")) as any;
  return {
    candle: fmt(c?.eventTime, city.tz),
    havdalah: fmt(h?.eventTime, city.tz),
    parsha: p ? p.render("he") : "",
    dateLabel: c?.eventTime
      ? new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: city.tz }).format(c.eventTime)
      : "",
  };
};

export interface TimelineStep {
  id: string;
  minutesBefore: number;
  title: string;
  hint: string;
}

/** Default Friday plan, counted back from candle lighting. */
export const DEFAULT_TIMELINE: TimelineStep[] = [
  { id: "shop", minutesBefore: 360, title: "קניות אחרונות", hint: "חלות, יין, פרחים" },
  { id: "cook", minutesBefore: 270, title: "בישול והעמדת חמין", hint: "דגים, מרק, חמין על האש" },
  { id: "clean", minutesBefore: 180, title: "סידור הבית ועריכת שולחן", hint: "מפה, כוס קידוש, פמוט" },
  { id: "drive", minutesBefore: 120, title: "יציאה מהעבודה / נסיעות", hint: "לבדוק פקקים ולהגיע בזמן" },
  { id: "plata", minutesBefore: 75, title: "הדלקת פלטה ומיחם", hint: "שעון שבת, אורות" },
  { id: "shower", minutesBefore: 60, title: "מקלחות ולבוש שבת", hint: "קודם הילדים" },
  { id: "music", minutesBefore: 25, title: "מוזיקת ערב שבת ונחת", hint: "להניח את הטלפון בצד" },
  { id: "candles", minutesBefore: 0, title: "הדלקת נרות", hint: "שבת שלום!" },
];

/** Parse HH:MM into a Date on the same day as `ref`. */
export const timeOnDay = (hhmm: string, ref: Date = new Date()): Date | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const d = new Date(ref);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d;
};

export const subtractMinutes = (hhmm: string, minutes: number): string => {
  const d = timeOnDay(hhmm);
  if (!d) return "--:--";
  d.setMinutes(d.getMinutes() - minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export interface TriviaQuestion {
  level: "ילדים" | "נוער" | "מבוגרים";
  q: string;
  a: string;
}

const TRIVIA_BANK: TriviaQuestion[] = [
  { level: "ילדים", q: "כמה נרות נהוג להדליק לפחות בערב שבת?", a: "שניים – כנגד \"זכור\" ו\"שמור\"" },
  { level: "ילדים", q: "באיזה יום נברא האדם?", a: "ביום השישי" },
  { level: "ילדים", q: "כמה חלות שמים על שולחן השבת ולמה?", a: "שתיים – זכר למן שירד כפול ביום שישי" },
  { level: "ילדים", q: "מה מכסים בזמן הקידוש?", a: "את החלות" },
  { level: "ילדים", q: "איך קוראים לטקס שמסיים את השבת?", a: "הבדלה" },
  { level: "ילדים", q: "כמה ספרים יש בחומש?", a: "חמישה" },
  { level: "נוער", q: "מה שתי המילים שבהן נאמרה מצוות שבת בשני נוסחי עשרת הדיברות?", a: "\"זכור\" (שמות) ו\"שמור\" (דברים)" },
  { level: "נוער", q: "מי חיבר את הפיוט \"לכה דודי\"?", a: "רבי שלמה הלוי אלקבץ, בצפת" },
  { level: "נוער", q: "כמה פרשות יש בתורה?", a: "54" },
  { level: "נוער", q: "מה מקור השם \"מלווה מלכה\"?", a: "סעודה שבה \"מלווים\" את שבת המלכה ביציאתה" },
  { level: "נוער", q: "על מה מברכים בהבדלה מלבד היין?", a: "בשמים ונר (מאורי האש)" },
  { level: "נוער", q: "איזה ספר מתנ\"ך קוראים בשבת חול המועד סוכות?", a: "קהלת" },
  { level: "מבוגרים", q: "כמה אבות מלאכה אסורים בשבת, ומאיפה נלמדים?", a: "39 – מהמלאכות שהיו במשכן" },
  { level: "מבוגרים", q: "מי אמר \"יותר משישראל שמרו את השבת, שמרה השבת אותם\"?", a: "אחד העם" },
  { level: "מבוגרים", q: "מהו \"עירוב תבשילין\"?", a: "הכנת תבשיל לפני יום טוב שחל ביום שישי, כדי שיותר לבשל בו לשבת" },
  { level: "מבוגרים", q: "מה הקשר בין שבת לבריאת העולם בנוסח הקידוש?", a: "\"זיכרון למעשה בראשית\" – וגם \"זכר ליציאת מצרים\"" },
  { level: "מבוגרים", q: "באיזו מסכת בתלמוד עוסקים בעיקר בהלכות שבת?", a: "מסכת שבת (וגם עירובין)" },
  { level: "מבוגרים", q: "מהו \"תוספת שבת\"?", a: "קבלת השבת מעט לפני השקיעה והוצאתה מעט אחרי צאת הכוכבים" },
];

export const CONVERSATION_CARDS: string[] = [
  "מה הרגע הכי טוב שהיה לך השבוע?",
  "על מה את/ה הכי מודה השבוע?",
  "אם היית יכול/ה להזמין לשולחן כל דמות מהתנ\"ך – את מי ולמה?",
  "איזה מנהג משפחתי היית רוצה שנמשיך גם בעוד 30 שנה?",
  "מה למדת השבוע שהפתיע אותך?",
  "מתי לאחרונה עזרת למישהו – ואיך זה הרגיש?",
  "איזה סיפור מסבא וסבתא היית רוצה לשמוע שוב?",
  "מה היית משנה בעולם אם היה לך יום אחד של כוח-על?",
  "מה פירוש המילה \"מנוחה\" בשבילך?",
  "באיזה רגע השבוע הרגשת הכי גאה בעצמך?",
  "אם השבת הייתה צבע – איזה צבע היא הייתה?",
  "מה הדבר שהכי חשוב לך שנעשה יחד כמשפחה?",
];

/** Deterministic weekly pick so everyone at the table sees the same set this week. */
const weekSeed = (d: Date = new Date()) => Math.floor(d.getTime() / (7 * 86400000));

const pick = <T,>(arr: T[], n: number, seed: number): T[] => {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

export const getWeeklyTrivia = (offset = 0, d?: Date): TriviaQuestion[] => {
  const seed = weekSeed(d) + offset * 7919;
  return (["ילדים", "נוער", "מבוגרים"] as const).flatMap((lvl) =>
    pick(TRIVIA_BANK.filter((t) => t.level === lvl), lvl === "מבוגרים" ? 1 : 2, seed),
  );
};

export const getWeeklyCards = (n = 3, offset = 0, d?: Date) => pick(CONVERSATION_CARDS, n, weekSeed(d) + offset * 104729);
