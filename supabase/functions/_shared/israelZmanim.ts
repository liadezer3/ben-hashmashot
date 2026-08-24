// Israeli (Rabbanut / luach) candle-lighting offsets, in minutes before sunset.
// Used to build Hebcal API URLs so server-side times match the app exactly.
const CANDLE_MINUTES: Record<string, number> = {
  jerusalem: 40,
  "ירושלים": 40,
  "maale adumim": 40,
  "מעלה אדומים": 40,
  "beitar illit": 40,
  "ביתר עילית": 40,
  efrat: 40,
  "אפרת": 40,
  "kiryat arba": 40,
  "קריית ארבע": 40,
  haifa: 30,
  "חיפה": 30,
  "petah tikva": 30,
  "פתח תקווה": 30,
  acre: 30,
  "עכו": 30,
  "zichron yaakov": 30,
  "זכרון יעקב": 30,
  beersheba: 22,
  "באר שבע": 22,
};

/** Default in Israel: 20 minutes before sunset */
export const DEFAULT_CANDLE_MINUTES = 20;

export const getCandleMinutes = (cityName?: string): number => {
  if (!cityName) return DEFAULT_CANDLE_MINUTES;
  return CANDLE_MINUTES[cityName.trim().toLowerCase()] ?? DEFAULT_CANDLE_MINUTES;
};

/**
 * Hebcal query params for the accepted Israeli standard:
 *  - b: candle lighting minutes before sunset
 *  - M=on: havdalah by tzeit hakochavim (8.5°) rather than a stringent fixed offset
 *  - i=on: Israeli holiday/sedra schedule
 */
export const israelZmanimParams = (cityName?: string): string =>
  `&b=${getCandleMinutes(cityName)}&M=on&i=on`;
