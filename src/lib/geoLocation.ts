// Geolocation utilities for automatic city detection

interface GeocodingResult {
  city: string;
  country: string;
}

// Israeli cities mapping from coordinates
const israeliCities = [
  { name: "ירושלים", lat: 31.7683, lon: 35.2137 },
  { name: "תל אביב", lat: 32.0853, lon: 34.7818 },
  { name: "חיפה", lat: 32.7940, lon: 34.9896 },
  { name: "באר שבע", lat: 31.2518, lon: 34.7913 },
  { name: "נתניה", lat: 32.3215, lon: 34.8532 },
  { name: "בני ברק", lat: 32.0840, lon: 34.8351 },
  { name: "רמת גן", lat: 32.0680, lon: 34.8241 },
  { name: "אשדוד", lat: 31.8044, lon: 34.6553 },
  { name: "פתח תקווה", lat: 32.0841, lon: 34.8878 },
  { name: "ראשון לציון", lat: 31.9730, lon: 34.7925 },
  { name: "הרצליה", lat: 32.1656, lon: 34.8467 },
  { name: "כפר סבא", lat: 32.1780, lon: 34.9066 },
  { name: "רעננה", lat: 32.1836, lon: 34.8714 },
  { name: "מודיעין", lat: 31.8977, lon: 35.0104 },
  { name: "אילת", lat: 29.5577, lon: 34.9519 },
];

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest Israeli city
function findNearestCity(lat: number, lon: number): string {
  let nearestCity = israeliCities[0].name;
  let minDistance = Infinity;

  for (const city of israeliCities) {
    const distance = calculateDistance(lat, lon, city.lat, city.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city.name;
    }
  }

  return nearestCity;
}

// Check if geolocation is supported
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

// Get current position
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

// Get city from coordinates
export async function getCityFromCoordinates(lat: number, lon: number): Promise<string> {
  // First try to match with known Israeli cities
  const nearestCity = findNearestCity(lat, lon);
  
  // Check if the distance is reasonable (within 50km of Israel)
  const isInIsrael = lat >= 29.5 && lat <= 33.5 && lon >= 34.2 && lon <= 35.9;
  
  if (isInIsrael) {
    return nearestCity;
  }

  // For locations outside Israel, try reverse geocoding
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=he`
    );
    const data = await response.json();
    
    return data.address?.city || 
           data.address?.town || 
           data.address?.village || 
           data.address?.municipality ||
           nearestCity;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return nearestCity;
  }
}

// Main function to detect user's city
export async function detectUserCity(): Promise<string> {
  try {
    const position = await getCurrentPosition();
    const city = await getCityFromCoordinates(
      position.coords.latitude,
      position.coords.longitude
    );
    return city;
  } catch (error) {
    console.error('Failed to detect city:', error);
    throw error;
  }
}
