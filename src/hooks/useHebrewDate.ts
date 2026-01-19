import { useState, useEffect, useCallback } from 'react';

export interface HebrewDateData {
  hebrew: string;        // Full Hebrew date string (e.g., "כ' בטבת תשפ"ו")
  hebrewDay: string;     // Hebrew day (e.g., "כ'")
  hebrewMonth: string;   // Hebrew month (e.g., "טבת")
  hebrewYear: string;    // Hebrew year (e.g., "תשפ"ו")
  gregorian: string;     // Gregorian date formatted
  dayOfWeek: string;     // Hebrew day of week (e.g., "יום ראשון")
}

export const useHebrewDate = (date: Date = new Date()) => {
  const [hebrewDate, setHebrewDate] = useState<HebrewDateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHebrewDate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const response = await fetch(
        `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Hebrew date');
      }
      
      const data = await response.json();
      
      // Format the Hebrew date
      const dayOfWeekNames = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
      const dayOfWeek = dayOfWeekNames[date.getDay()];
      
      // Format Gregorian date in Hebrew locale
      const gregorianFormatter = new Intl.DateTimeFormat('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      setHebrewDate({
        hebrew: data.hebrew || '',
        hebrewDay: data.hd?.toString() || '',
        hebrewMonth: data.hm || '',
        hebrewYear: data.hy?.toString() || '',
        gregorian: gregorianFormatter.format(date),
        dayOfWeek,
      });
    } catch (err) {
      console.error('Error fetching Hebrew date:', err);
      setError('לא הצלחנו לטעון את התאריך העברי');
    } finally {
      setLoading(false);
    }
  }, [date.getDate(), date.getMonth(), date.getFullYear()]);

  useEffect(() => {
    fetchHebrewDate();
  }, [fetchHebrewDate]);

  return {
    hebrewDate,
    loading,
    error,
    refetch: fetchHebrewDate,
  };
};
