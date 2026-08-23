// Local, offline Shabbat times calculation using @hebcal/core with the
// accepted Israeli (Rabbanut / luach) standard:
//  - Israeli holiday & sedra schedule (il: true)
//  - Candle lighting a fixed number of minutes BEFORE sunset (20 by default,
//    40 in Jerusalem, 30 in Haifa / Petah Tikva, 22 in Beersheba, etc.)
//  - Havdalah / end of Shabbat by tzeit hakochavim at 8.5° solar depression
//    (the common Israeli luach value). Rabbeinu Tam (72 min) only if chosen.
import { HebrewCalendar, Location, Zmanim, flags } from "@hebcal/core";
import { getCityCoords, DEFAULT_CANDLE_MINUTES } from "./cityCoords";

export type HavdalahMethod = "tzeit_8_5" | "tzeit_7_083" | "fixed_20" | "fixed_30" | "fixed_42" | "rabbeinu_tam_72";

export interface ZmanimSettings {
  /** minutes before sunset for candle lighting (overrides the city default) */
  candleMinutes?: number;
  havdalahMethod: HavdalahMethod;
}

const SETTINGS_KEY = "ben-hashmashot:zmanim-settings";

export const DEFAULT_ZMANIM_SETTINGS: ZmanimSettings = {
  havdalahMethod: "tzeit_8_5",
};

export const HAVDALAH_LABELS: Record<HavdalahMethod, string> = {
  tzeit_8_5: 'צאת הכוכבים 8.5° (הסטנדרט המקובל בארץ)',
  tzeit_7_083: 'צאת הכוכבים 7.083° (3 כוכבים בינוניים)',
  fixed_20: "20 דקות אחרי השקיעה",
  fixed_30: "30 דקות אחרי השקיעה",
  fixed_42: "42 דקות אחרי השקיעה",
  rabbeinu_tam_72: 'רבנו תם (72 דקות) — מחמיר',
};

export const getZmanimSettings = (): ZmanimSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_ZMANIM_SETTINGS;
    return { ...DEFAULT_ZMANIM_SETTINGS, ...(JSON.parse(raw) as ZmanimSettings) };
  } catch {
    return DEFAULT_ZMANIM_SETTINGS;
  }
};

export const setZmanimSettings = (settings: ZmanimSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("zmanim-settings-changed"));
};

const havdalahOptions = (method: HavdalahMethod): { havdalahDeg?: number; havdalahMins?: number } => {
  switch (method) {
    case "tzeit_7_083":
      return { havdalahDeg: 7.083 };
    case "fixed_20":
      return { havdalahMins: 20 };
    case "fixed_30":
      return { havdalahMins: 30 };
    case "fixed_42":
      return { havdalahMins: 42 };
    case "rabbeinu_tam_72":
      return { havdalahMins: 72 };
    case "tzeit_8_5":
    default:
      return { havdalahDeg: 8.5 };
  }
};

export interface ShabbatZmanimResult {
  city: string;
  lat: number;
  lon: number;
  tz: string;
  candleMinutes: number;
  havdalahMethod: HavdalahMethod;
  /** HH:MM */
  candleLightingTime: string;
  candleLightingDate: Date | null;
  havdalahTime: string;
  havdalahDate: Date | null;
  parsha: string;
  /** name of the holiday causing candle lighting, if not a regular Shabbat */
  holiday: string | null;
  sunsetTime: string;
  sunriseTime: string;
  tzeitTime: string;
  alotTime: string;
  /** formatted Hebrew date of the Friday/eve */
  shabbatEntryLabel: string;
}

export const formatTime = (date: Date | null | undefined, tz: string): string => {
  if (!date || isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(date);
};

export const buildLocation = (cityName?: string): Location => {
  const { lat, lon, tz, elevation } = getCityCoords(cityName);
  return new Location(lat, lon, true, tz, cityName || "Jerusalem", "IL", undefined, elevation);
};

/**
 * Compute the upcoming (or current) Shabbat / Yom Tov times for a city,
 * fully offline, using the Israeli standard.
 */
export const getShabbatZmanim = (
  cityName: string = "Jerusalem",
  now: Date = new Date()
): ShabbatZmanimResult => {
  const coords = getCityCoords(cityName);
  const settings = getZmanimSettings();
  const candleMinutes = settings.candleMinutes ?? coords.candleMinutes ?? DEFAULT_CANDLE_MINUTES;
  const location = buildLocation(cityName);

  const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);

  const events = HebrewCalendar.calendar({
    start,
    end,
    location,
    il: true,
    candlelighting: true,
    candleLightingMins: candleMinutes,
    ...havdalahOptions(settings.havdalahMethod),
    sedrot: true,
    locale: "he",
    useElevation: false,
  });

  const candles = events.filter((e) => (e.getFlags() & flags.LIGHT_CANDLES) || (e.getFlags() & flags.LIGHT_CANDLES_TZEIS));
  const havdalot = events.filter((e) => (e.getFlags() & flags.YOM_TOV_ENDS) !== 0);
  const parshaEvents = events.filter((e) => (e.getFlags() & flags.PARSHA_HASHAVUA) !== 0);

  const upcoming = <T extends { eventTime?: Date }>(list: T[]): T | undefined =>
    list.find((e) => e.eventTime && e.eventTime.getTime() > now.getTime());

  const candleEvent = (upcoming(candles as any) || candles[candles.length - 1]) as any;
  const havdalahEvent = (upcoming(havdalot as any) || havdalot[havdalot.length - 1]) as any;

  const candleLightingDate: Date | null = candleEvent?.eventTime ?? null;
  const havdalahDate: Date | null = havdalahEvent?.eventTime ?? null;

  // Parsha closest to (at or after) the candle lighting date
  const refDate = candleLightingDate || now;
  const parshaEvent =
    parshaEvents.find((e) => e.getDate().greg().getTime() >= refDate.getTime() - 24 * 60 * 60 * 1000) ||
    parshaEvents[0];

  const zDay = candleLightingDate || now;
  const z = new Zmanim(location, zDay, false);
  const safe = (fn: () => Date): Date | null => {
    try {
      return fn();
    } catch {
      return null;
    }
  };

  const shabbatEntryLabel = candleLightingDate
    ? new Intl.DateTimeFormat("he-IL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: coords.tz,
      }).format(candleLightingDate)
    : "";

  const holidayFlags = candleEvent ? candleEvent.getFlags?.() ?? 0 : 0;
  const isYomTov = (holidayFlags & flags.CHAG) !== 0;

  return {
    city: cityName,
    lat: coords.lat,
    lon: coords.lon,
    tz: coords.tz,
    candleMinutes,
    havdalahMethod: settings.havdalahMethod,
    candleLightingTime: formatTime(candleLightingDate, coords.tz),
    candleLightingDate,
    havdalahTime: formatTime(havdalahDate, coords.tz),
    havdalahDate,
    parsha: parshaEvent ? parshaEvent.render("he") : "",
    holiday: isYomTov && candleEvent?.linkedEvent ? candleEvent.linkedEvent.render("he") : null,
    sunsetTime: formatTime(safe(() => z.sunset()), coords.tz),
    sunriseTime: formatTime(safe(() => z.sunrise()), coords.tz),
    tzeitTime: formatTime(safe(() => z.tzeit(8.5)), coords.tz),
    alotTime: formatTime(safe(() => z.alotHaShachar()), coords.tz),
    shabbatEntryLabel,
  };
};
