import { useState, useEffect, useCallback } from 'react';

export interface ShabbatTimeData {
  candleLighting: string;
  candleLightingDate: Date | null;
  havdalah: string;
  havdalahDate: Date | null;
  parashat: string;
  city: string;
}

const getCityGeoId = (cityName: string): string => {
  const cities: { [key: string]: string } = {
    "Jerusalem": "281184",
    "ירושלים": "281184",
    "Tel Aviv": "293397",
    "תל אביב": "293397",
    "Haifa": "294801",
    "חיפה": "294801",
    "Beersheba": "295530",
    "באר שבע": "295530",
    "Netanya": "293100",
    "נתניה": "293100",
    "Bnei Brak": "295432",
    "בני ברק": "295432",
    "Ramat Gan": "293703",
    "רמת גן": "293703",
    "Ashdod": "295629",
    "אשדוד": "295629",
    "Petah Tikva": "293703",
    "פתח תקווה": "293703"
  };
  return cities[cityName] || "281184";
};

export const useShabbatTimes = (city: string = "Jerusalem") => {
  const [shabbatTimes, setShabbatTimes] = useState<ShabbatTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShabbatTimes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const geoId = getCityGeoId(city);
      const response = await fetch(
        `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on&lg=h`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Shabbat times');
      }
      
      const data = await response.json();
      
      const candleLighting = data.items.find((item: any) => item.category === 'candles');
      const havdalah = data.items.find((item: any) => item.category === 'havdalah');
      const parashat = data.items.find((item: any) => item.category === 'parashat');

      // Parse the candle lighting date
      let candleLightingDate: Date | null = null;
      if (candleLighting?.date) {
        candleLightingDate = new Date(candleLighting.date);
      }

      // Parse the havdalah date
      let havdalahDate: Date | null = null;
      if (havdalah?.date) {
        havdalahDate = new Date(havdalah.date);
      }

      setShabbatTimes({
        candleLighting: candleLighting?.title || '',
        candleLightingDate,
        havdalah: havdalah?.title || '',
        havdalahDate,
        parashat: parashat?.hebrew || parashat?.title || '',
        city,
      });
    } catch (err) {
      console.error('Error fetching Shabbat times:', err);
      setError('לא הצלחנו לטעון את זמני השבת');
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchShabbatTimes();
  }, [fetchShabbatTimes]);

  // Calculate minutes until candle lighting
  const getMinutesUntilCandleLighting = useCallback((): number | null => {
    if (!shabbatTimes?.candleLightingDate) return null;
    
    const now = new Date();
    const candleTime = shabbatTimes.candleLightingDate;
    
    // If candle lighting already passed, return null
    if (candleTime.getTime() < now.getTime()) return null;
    
    const diffMs = candleTime.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }, [shabbatTimes]);

  // Calculate minutes until havdalah
  const getMinutesUntilHavdalah = useCallback((): number | null => {
    if (!shabbatTimes?.havdalahDate) return null;
    
    const now = new Date();
    const havdalahTime = shabbatTimes.havdalahDate;
    
    // If havdalah already passed, return null
    if (havdalahTime.getTime() < now.getTime()) return null;
    
    const diffMs = havdalahTime.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }, [shabbatTimes]);

  return {
    shabbatTimes,
    loading,
    error,
    refetch: fetchShabbatTimes,
    getMinutesUntilCandleLighting,
    getMinutesUntilHavdalah,
  };
};
