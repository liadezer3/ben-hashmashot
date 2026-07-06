// Local daily halachic times (zmanim) using @hebcal/core.
import { Zmanim, GeoLocation } from "@hebcal/core";
import { getCityCoords } from "./cityCoords";

export interface HalachicTime {
  key: string;
  label: string;
  time: string; // HH:MM in the city timezone
  description: string;
}

const fmt = (date: Date | null | undefined, tz: string): string => {
  if (!date || isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(date);
};

export const getDailyHalachicTimes = (
  cityName?: string,
  date: Date = new Date()
): HalachicTime[] => {
  const { lat, lon, tz, elevation } = getCityCoords(cityName);
  const gloc = new GeoLocation(cityName || "Jerusalem", lat, lon, elevation, tz);
  const z = new Zmanim(gloc, date, false);

  const safe = (fn: () => Date): Date | null => {
    try {
      return fn();
    } catch {
      return null;
    }
  };

  const rows: Array<{ key: string; label: string; description: string; date: Date | null }> = [
    { key: "alotHaShachar", label: "עלות השחר", description: "תחילת היום ההלכתי", date: safe(() => z.alotHaShachar()) },
    { key: "misheyakir", label: "משיכיר (טלית ותפילין)", description: "זמן הנחת טלית ותפילין", date: safe(() => z.misheyakir()) },
    { key: "sunrise", label: "הנץ החמה", description: "זריחה - זמן תפילה כוותיקין", date: safe(() => z.sunrise()) },
    { key: "sofZmanShma", label: "סוף זמן קריאת שמע", description: "לפי הגר\"א", date: safe(() => z.sofZmanShma()) },
    { key: "sofZmanTfilla", label: "סוף זמן תפילה", description: "לפי הגר\"א", date: safe(() => z.sofZmanTfilla()) },
    { key: "chatzot", label: "חצות היום", description: "אמצע היום", date: safe(() => z.chatzot()) },
    { key: "minchaGedola", label: "מנחה גדולה", description: "תחילת זמן מנחה", date: safe(() => z.minchaGedola()) },
    { key: "plagHaMincha", label: "פלג המנחה", description: "זמן קבלת שבת מוקדמת", date: safe(() => z.plagHaMincha()) },
    { key: "shkiah", label: "שקיעה", description: "סוף היום", date: safe(() => z.shkiah()) },
    { key: "tzeit", label: "צאת הכוכבים", description: "צאת הכוכבים - סוף יום הלכתי", date: safe(() => z.tzeit()) },
  ];

  return rows.map((r) => ({
    key: r.key,
    label: r.label,
    time: fmt(r.date, tz),
    description: r.description,
  }));
};
