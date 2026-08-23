import { useState, useEffect, useCallback } from 'react';
import { getShabbatZmanim, ShabbatZmanimResult } from '@/lib/shabbatZmanim';

export interface ShabbatTimeData {
  candleLighting: string;
  candleLightingDate: Date | null;
  havdalah: string;
  havdalahDate: Date | null;
  parashat: string;
  city: string;
  sunrise: string;
  sunset: string;
  tzeit: string;
  alot: string;
  shabbatEntry: string;
  candleMinutes: number;
}

const toTimeData = (z: ShabbatZmanimResult): ShabbatTimeData => ({
  candleLighting: z.candleLightingTime,
  candleLightingDate: z.candleLightingDate,
  havdalah: z.havdalahTime,
  havdalahDate: z.havdalahDate,
  parashat: z.parsha,
  city: z.city,
  sunrise: z.sunriseTime,
  sunset: z.sunsetTime,
  tzeit: z.tzeitTime,
  alot: z.alotTime,
  shabbatEntry: z.shabbatEntryLabel,
  candleMinutes: z.candleMinutes,
});

export const useShabbatTimes = (city: string = "Jerusalem") => {
  const [shabbatTimes, setShabbatTimes] = useState<ShabbatTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fully local (offline) calculation using the Israeli standard.
  const fetchShabbatTimes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setShabbatTimes(toTimeData(getShabbatZmanim(city)));
    } catch (err) {
      console.error('Error calculating Shabbat times:', err);
      setError('לא הצלחנו לחשב את זמני השבת');
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchShabbatTimes();
  }, [fetchShabbatTimes]);

  // Recalculate when the user changes coordinates / zmanim settings
  useEffect(() => {
    const handler = () => fetchShabbatTimes();
    window.addEventListener('zmanim-settings-changed', handler);
    return () => window.removeEventListener('zmanim-settings-changed', handler);
  }, [fetchShabbatTimes]);

  const getMinutesUntilCandleLighting = useCallback((): number | null => {
    if (!shabbatTimes?.candleLightingDate) return null;
    const diffMs = shabbatTimes.candleLightingDate.getTime() - Date.now();
    if (diffMs < 0) return null;
    return Math.floor(diffMs / (1000 * 60));
  }, [shabbatTimes]);

  const getMinutesUntilHavdalah = useCallback((): number | null => {
    if (!shabbatTimes?.havdalahDate) return null;
    const diffMs = shabbatTimes.havdalahDate.getTime() - Date.now();
    if (diffMs < 0) return null;
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
