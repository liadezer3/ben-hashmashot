// Centralized coordinate lookup for supported Israeli cities.
// Used for local zmanim calculation (@hebcal/core) and weather (Open-Meteo).

export interface CityCoords {
  lat: number;
  lon: number;
  tz: string;
  elevation: number;
}

const DEFAULT_TZ = "Asia/Jerusalem";

// Keyed by both English and Hebrew names (lowercased for English).
const COORDS: Record<string, CityCoords> = {
  jerusalem: { lat: 31.7683, lon: 35.2137, tz: DEFAULT_TZ, elevation: 754 },
  "ירושלים": { lat: 31.7683, lon: 35.2137, tz: DEFAULT_TZ, elevation: 754 },
  "tel aviv": { lat: 32.0853, lon: 34.7818, tz: DEFAULT_TZ, elevation: 5 },
  "תל אביב": { lat: 32.0853, lon: 34.7818, tz: DEFAULT_TZ, elevation: 5 },
  haifa: { lat: 32.794, lon: 34.9896, tz: DEFAULT_TZ, elevation: 300 },
  "חיפה": { lat: 32.794, lon: 34.9896, tz: DEFAULT_TZ, elevation: 300 },
  beersheba: { lat: 31.2518, lon: 34.7913, tz: DEFAULT_TZ, elevation: 260 },
  "באר שבע": { lat: 31.2518, lon: 34.7913, tz: DEFAULT_TZ, elevation: 260 },
  netanya: { lat: 32.3215, lon: 34.8532, tz: DEFAULT_TZ, elevation: 30 },
  "נתניה": { lat: 32.3215, lon: 34.8532, tz: DEFAULT_TZ, elevation: 30 },
  "bnei brak": { lat: 32.084, lon: 34.8351, tz: DEFAULT_TZ, elevation: 20 },
  "בני ברק": { lat: 32.084, lon: 34.8351, tz: DEFAULT_TZ, elevation: 20 },
  "ramat gan": { lat: 32.068, lon: 34.8241, tz: DEFAULT_TZ, elevation: 40 },
  "רמת גן": { lat: 32.068, lon: 34.8241, tz: DEFAULT_TZ, elevation: 40 },
  ashdod: { lat: 31.8044, lon: 34.6553, tz: DEFAULT_TZ, elevation: 15 },
  "אשדוד": { lat: 31.8044, lon: 34.6553, tz: DEFAULT_TZ, elevation: 15 },
  "petah tikva": { lat: 32.0841, lon: 34.8878, tz: DEFAULT_TZ, elevation: 50 },
  "פתח תקווה": { lat: 32.0841, lon: 34.8878, tz: DEFAULT_TZ, elevation: 50 },
  "rishon lezion": { lat: 31.973, lon: 34.7925, tz: DEFAULT_TZ, elevation: 40 },
  "ראשון לציון": { lat: 31.973, lon: 34.7925, tz: DEFAULT_TZ, elevation: 40 },
  holon: { lat: 32.0167, lon: 34.7792, tz: DEFAULT_TZ, elevation: 25 },
  "חולון": { lat: 32.0167, lon: 34.7792, tz: DEFAULT_TZ, elevation: 25 },
  ashkelon: { lat: 31.6688, lon: 34.5715, tz: DEFAULT_TZ, elevation: 55 },
  "אשקלון": { lat: 31.6688, lon: 34.5715, tz: DEFAULT_TZ, elevation: 55 },
  rehovot: { lat: 31.8928, lon: 34.8113, tz: DEFAULT_TZ, elevation: 76 },
  "רחובות": { lat: 31.8928, lon: 34.8113, tz: DEFAULT_TZ, elevation: 76 },
  herzliya: { lat: 32.1656, lon: 34.8467, tz: DEFAULT_TZ, elevation: 40 },
  "הרצליה": { lat: 32.1656, lon: 34.8467, tz: DEFAULT_TZ, elevation: 40 },
  "kfar saba": { lat: 32.178, lon: 34.9066, tz: DEFAULT_TZ, elevation: 60 },
  "כפר סבא": { lat: 32.178, lon: 34.9066, tz: DEFAULT_TZ, elevation: 60 },
  modiin: { lat: 31.8977, lon: 35.0104, tz: DEFAULT_TZ, elevation: 280 },
  "מודיעין": { lat: 31.8977, lon: 35.0104, tz: DEFAULT_TZ, elevation: 280 },
  raanana: { lat: 32.1836, lon: 34.8714, tz: DEFAULT_TZ, elevation: 71 },
  "רעננה": { lat: 32.1836, lon: 34.8714, tz: DEFAULT_TZ, elevation: 71 },
  tiberias: { lat: 32.7959, lon: 35.5312, tz: DEFAULT_TZ, elevation: -200 },
  "טבריה": { lat: 32.7959, lon: 35.5312, tz: DEFAULT_TZ, elevation: -200 },
  safed: { lat: 32.9646, lon: 35.496, tz: DEFAULT_TZ, elevation: 900 },
  "צפת": { lat: 32.9646, lon: 35.496, tz: DEFAULT_TZ, elevation: 900 },
  eilat: { lat: 29.5577, lon: 34.9519, tz: DEFAULT_TZ, elevation: 12 },
  "אילת": { lat: 29.5577, lon: 34.9519, tz: DEFAULT_TZ, elevation: 12 },
  nazareth: { lat: 32.7028, lon: 35.2973, tz: DEFAULT_TZ, elevation: 350 },
  "נצרת": { lat: 32.7028, lon: 35.2973, tz: DEFAULT_TZ, elevation: 350 },
};

export const getCityCoords = (cityName?: string): CityCoords => {
  if (!cityName) return COORDS.jerusalem;
  const key = cityName.trim().toLowerCase();
  return COORDS[key] || COORDS[cityName.trim()] || COORDS.jerusalem;
};
