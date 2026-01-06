// Centralized city configuration for the entire app
export interface City {
  name: string;
  hebrewName: string;
  geoId: string;
}

export const SUPPORTED_CITIES: City[] = [
  { name: "Jerusalem", hebrewName: "ירושלים", geoId: "281184" },
  { name: "Tel Aviv", hebrewName: "תל אביב", geoId: "293397" },
  { name: "Haifa", hebrewName: "חיפה", geoId: "294801" },
  { name: "Beersheba", hebrewName: "באר שבע", geoId: "295530" },
  { name: "Netanya", hebrewName: "נתניה", geoId: "293100" },
  { name: "Bnei Brak", hebrewName: "בני ברק", geoId: "295432" },
  { name: "Ramat Gan", hebrewName: "רמת גן", geoId: "293703" },
  { name: "Ashdod", hebrewName: "אשדוד", geoId: "295629" },
  { name: "Petah Tikva", hebrewName: "פתח תקווה", geoId: "293918" },
  { name: "Rishon LeZion", hebrewName: "ראשון לציון", geoId: "293807" },
  { name: "Holon", hebrewName: "חולון", geoId: "294751" },
  { name: "Ashkelon", hebrewName: "אשקלון", geoId: "295620" },
  { name: "Rehovot", hebrewName: "רחובות", geoId: "293725" },
  { name: "Bat Yam", hebrewName: "בת ים", geoId: "295548" },
  { name: "Herzliya", hebrewName: "הרצליה", geoId: "294778" },
  { name: "Kfar Saba", hebrewName: "כפר סבא", geoId: "294514" },
  { name: "Modiin", hebrewName: "מודיעין", geoId: "282926" },
  { name: "Raanana", hebrewName: "רעננה", geoId: "293768" },
  { name: "Lod", hebrewName: "לוד", geoId: "294421" },
  { name: "Ramla", hebrewName: "רמלה", geoId: "293690" },
  { name: "Nazareth", hebrewName: "נצרת", geoId: "294098" },
  { name: "Acre", hebrewName: "עכו", geoId: "295721" },
  { name: "Tiberias", hebrewName: "טבריה", geoId: "293322" },
  { name: "Safed", hebrewName: "צפת", geoId: "293100" },
  { name: "Eilat", hebrewName: "אילת", geoId: "295277" },
];

export const getCityGeoId = (cityName: string): string => {
  // Check by English name
  const cityByName = SUPPORTED_CITIES.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  );
  if (cityByName) return cityByName.geoId;

  // Check by Hebrew name
  const cityByHebrew = SUPPORTED_CITIES.find(
    c => c.hebrewName === cityName
  );
  if (cityByHebrew) return cityByHebrew.geoId;

  // Default to Jerusalem
  return "281184";
};

export const getCityDisplayName = (cityName: string): string => {
  const city = SUPPORTED_CITIES.find(
    c => c.name.toLowerCase() === cityName.toLowerCase() || c.hebrewName === cityName
  );
  return city?.hebrewName || cityName;
};

export const findNearestCity = (lat: number, lon: number): City => {
  // Approximate coordinates for each city
  const cityCoordinates: Record<string, { lat: number; lon: number }> = {
    "Jerusalem": { lat: 31.7683, lon: 35.2137 },
    "Tel Aviv": { lat: 32.0853, lon: 34.7818 },
    "Haifa": { lat: 32.7940, lon: 34.9896 },
    "Beersheba": { lat: 31.2530, lon: 34.7915 },
    "Netanya": { lat: 32.3286, lon: 34.8569 },
    "Bnei Brak": { lat: 32.0836, lon: 34.8331 },
    "Ramat Gan": { lat: 32.0680, lon: 34.8248 },
    "Ashdod": { lat: 31.8014, lon: 34.6431 },
    "Petah Tikva": { lat: 32.0841, lon: 34.8878 },
    "Rishon LeZion": { lat: 31.9730, lon: 34.7925 },
    "Holon": { lat: 32.0158, lon: 34.7731 },
    "Ashkelon": { lat: 31.6688, lon: 34.5743 },
    "Rehovot": { lat: 31.8928, lon: 34.8113 },
    "Bat Yam": { lat: 32.0171, lon: 34.7503 },
    "Herzliya": { lat: 32.1663, lon: 34.8464 },
    "Kfar Saba": { lat: 32.1713, lon: 34.9064 },
    "Modiin": { lat: 31.8969, lon: 35.0104 },
    "Raanana": { lat: 32.1832, lon: 34.8708 },
    "Lod": { lat: 31.9514, lon: 34.8951 },
    "Ramla": { lat: 31.9279, lon: 34.8664 },
    "Nazareth": { lat: 32.7021, lon: 35.2978 },
    "Acre": { lat: 32.9330, lon: 35.0767 },
    "Tiberias": { lat: 32.7922, lon: 35.5312 },
    "Safed": { lat: 32.9646, lon: 35.4969 },
    "Eilat": { lat: 29.5577, lon: 34.9519 },
  };

  let nearestCity = SUPPORTED_CITIES[0];
  let minDistance = Infinity;

  for (const city of SUPPORTED_CITIES) {
    const coords = cityCoordinates[city.name];
    if (!coords) continue;

    // Haversine distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (coords.lat - lat) * Math.PI / 180;
    const dLon = (coords.lon - lon) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
};
