// Centralized coordinate lookup for supported Israeli cities and settlements.
// Used for local zmanim calculation (@hebcal/core) and weather (Open-Meteo).
// Values follow the accepted Israeli (Rabbanut / luach) standard:
//  - candleMinutes = minutes before sunset for candle lighting
//    (Jerusalem 40, Haifa / Zichron Ya'akov 30, Petah Tikva 30, elsewhere 20/22)

export interface CityCoords {
  lat: number;
  lon: number;
  tz: string;
  elevation: number;
  /** minutes before sunset for candle lighting */
  candleMinutes: number;
}

const DEFAULT_TZ = "Asia/Jerusalem";

/** Israeli default: 20 minutes before sunset */
export const DEFAULT_CANDLE_MINUTES = 20;

const c = (
  lat: number,
  lon: number,
  elevation: number,
  candleMinutes: number = DEFAULT_CANDLE_MINUTES
): CityCoords => ({ lat, lon, tz: DEFAULT_TZ, elevation, candleMinutes });

// Keyed by both English (lowercase) and Hebrew names.
const COORDS: Record<string, CityCoords> = {
  jerusalem: c(31.7683, 35.2137, 754, 40),
  "ירושלים": c(31.7683, 35.2137, 754, 40),
  "tel aviv": c(32.0853, 34.7818, 5, 20),
  "תל אביב": c(32.0853, 34.7818, 5, 20),
  haifa: c(32.794, 34.9896, 300, 30),
  "חיפה": c(32.794, 34.9896, 300, 30),
  beersheba: c(31.2518, 34.7913, 260, 22),
  "באר שבע": c(31.2518, 34.7913, 260, 22),
  netanya: c(32.3215, 34.8532, 30, 20),
  "נתניה": c(32.3215, 34.8532, 30, 20),
  "bnei brak": c(32.084, 34.8351, 20, 20),
  "בני ברק": c(32.084, 34.8351, 20, 20),
  "ramat gan": c(32.068, 34.8241, 40, 20),
  "רמת גן": c(32.068, 34.8241, 40, 20),
  ashdod: c(31.8044, 34.6553, 15, 20),
  "אשדוד": c(31.8044, 34.6553, 15, 20),
  "petah tikva": c(32.0841, 34.8878, 50, 30),
  "פתח תקווה": c(32.0841, 34.8878, 50, 30),
  "rishon lezion": c(31.973, 34.7925, 40, 20),
  "ראשון לציון": c(31.973, 34.7925, 40, 20),
  holon: c(32.0167, 34.7792, 25, 20),
  "חולון": c(32.0167, 34.7792, 25, 20),
  "bat yam": c(32.0171, 34.7503, 15, 20),
  "בת ים": c(32.0171, 34.7503, 15, 20),
  ashkelon: c(31.6688, 34.5715, 55, 20),
  "אשקלון": c(31.6688, 34.5715, 55, 20),
  rehovot: c(31.8928, 34.8113, 76, 20),
  "רחובות": c(31.8928, 34.8113, 76, 20),
  herzliya: c(32.1656, 34.8467, 40, 20),
  "הרצליה": c(32.1656, 34.8467, 40, 20),
  "kfar saba": c(32.178, 34.9066, 60, 20),
  "כפר סבא": c(32.178, 34.9066, 60, 20),
  modiin: c(31.8977, 35.0104, 280, 20),
  "מודיעין": c(31.8977, 35.0104, 280, 20),
  raanana: c(32.1836, 34.8714, 71, 20),
  "רעננה": c(32.1836, 34.8714, 71, 20),
  lod: c(31.9514, 34.8951, 65, 20),
  "לוד": c(31.9514, 34.8951, 65, 20),
  ramla: c(31.9279, 34.8664, 75, 20),
  "רמלה": c(31.9279, 34.8664, 75, 20),
  tiberias: c(32.7959, 35.5312, -200, 20),
  "טבריה": c(32.7959, 35.5312, -200, 20),
  safed: c(32.9646, 35.496, 900, 20),
  "צפת": c(32.9646, 35.496, 900, 20),
  eilat: c(29.5577, 34.9519, 12, 20),
  "אילת": c(29.5577, 34.9519, 12, 20),
  nazareth: c(32.7028, 35.2973, 350, 20),
  "נצרת": c(32.7028, 35.2973, 350, 20),
  acre: c(32.933, 35.0767, 10, 30),
  "עכו": c(32.933, 35.0767, 10, 30),
  "zichron yaakov": c(32.5714, 34.9536, 150, 30),
  "זכרון יעקב": c(32.5714, 34.9536, 150, 30),
  "maale adumim": c(31.7772, 35.2975, 610, 40),
  "מעלה אדומים": c(31.7772, 35.2975, 610, 40),
  "beit shemesh": c(31.7497, 34.9887, 300, 20),
  "בית שמש": c(31.7497, 34.9887, 300, 20),
  efrat: c(31.6553, 35.1631, 900, 40),
  "אפרת": c(31.6553, 35.1631, 900, 40),
  ariel: c(32.1053, 35.1872, 550, 20),
  "אריאל": c(32.1053, 35.1872, 550, 20),
  "kiryat gat": c(31.61, 34.7642, 100, 20),
  "קריית גת": c(31.61, 34.7642, 100, 20),
  "kiryat shmona": c(33.2072, 35.5695, 150, 20),
  "קריית שמונה": c(33.2072, 35.5695, 150, 20),
  hadera: c(32.4341, 34.9196, 25, 20),
  "חדרה": c(32.4341, 34.9196, 25, 20),
  "givat shmuel": c(32.0783, 34.8481, 40, 20),
  "גבעת שמואל": c(32.0783, 34.8481, 40, 20),
  "modiin illit": c(31.9317, 35.0428, 320, 20),
  "מודיעין עילית": c(31.9317, 35.0428, 320, 20),
  "beitar illit": c(31.6961, 35.1147, 800, 40),
  "ביתר עילית": c(31.6961, 35.1147, 800, 40),
  "kiryat arba": c(31.5225, 35.1119, 950, 40),
  "קריית ארבע": c(31.5225, 35.1119, 950, 40),
  dimona: c(31.0686, 35.0333, 570, 20),
  "דימונה": c(31.0686, 35.0333, 570, 20),
};

// ---------------------------------------------------------------------------
// User overrides (per city / settlement) — stored locally so they also work
// fully offline during Shabbat.
// ---------------------------------------------------------------------------

export interface CityOverride {
  lat: number;
  lon: number;
  elevation?: number;
  tz?: string;
  candleMinutes?: number;
}

const OVERRIDES_KEY = "ben-hashmashot:city-coord-overrides";

const normalizeKey = (cityName: string) => cityName.trim().toLowerCase();

export const getCityOverrides = (): Record<string, CityOverride> => {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CityOverride>) : {};
  } catch {
    return {};
  }
};

export const getCityOverride = (cityName?: string): CityOverride | null => {
  if (!cityName) return null;
  return getCityOverrides()[normalizeKey(cityName)] || null;
};

export const setCityOverride = (cityName: string, override: CityOverride) => {
  const all = getCityOverrides();
  all[normalizeKey(cityName)] = override;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("zmanim-settings-changed"));
};

export const clearCityOverride = (cityName: string) => {
  const all = getCityOverrides();
  delete all[normalizeKey(cityName)];
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("zmanim-settings-changed"));
};

/** Base (built-in) coordinates, ignoring user overrides. */
export const getBaseCityCoords = (cityName?: string): CityCoords => {
  if (!cityName) return COORDS.jerusalem;
  const key = normalizeKey(cityName);
  return COORDS[key] || COORDS[cityName.trim()] || COORDS.jerusalem;
};

export const getCityCoords = (cityName?: string): CityCoords => {
  const base = getBaseCityCoords(cityName);
  const override = getCityOverride(cityName);
  if (!override) return base;
  return {
    lat: override.lat,
    lon: override.lon,
    tz: override.tz || base.tz,
    elevation: override.elevation ?? base.elevation,
    candleMinutes: override.candleMinutes ?? base.candleMinutes,
  };
};

export const isKnownCity = (cityName?: string): boolean => {
  if (!cityName) return false;
  const key = normalizeKey(cityName);
  return Boolean(COORDS[key] || COORDS[cityName.trim()]);
};
