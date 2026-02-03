import { useState, useMemo } from 'react';
import { HDate, gematriya, months, Locale } from '@hebcal/core';

export interface HebrewDateData {
  hebrew: string;        // Full Hebrew date string (e.g., "ט״ו חֶשְׁוָן תשס״ט")
  hebrewDay: string;     // Hebrew day in gematriya (e.g., "ט״ו")
  hebrewMonth: string;   // Hebrew month (e.g., "חשון")
  hebrewYear: string;    // Hebrew year in gematriya (e.g., "תשס״ט")
  gregorian: string;     // Gregorian date formatted
  dayOfWeek: string;     // Hebrew day of week (e.g., "יום ראשון")
}

// Hebrew month names mapping
const hebrewMonthNames: Record<number, string> = {
  [months.NISAN]: 'ניסן',
  [months.IYYAR]: 'אייר',
  [months.SIVAN]: 'סיוון',
  [months.TAMUZ]: 'תמוז',
  [months.AV]: 'אב',
  [months.ELUL]: 'אלול',
  [months.TISHREI]: 'תשרי',
  [months.CHESHVAN]: 'חשוון',
  [months.KISLEV]: 'כסלו',
  [months.TEVET]: 'טבת',
  [months.SHVAT]: 'שבט',
  [months.ADAR_I]: 'אדר א׳',
  [months.ADAR_II]: 'אדר ב׳',
};

export const useHebrewDate = (date: Date = new Date()) => {
  const [error, setError] = useState<string | null>(null);

  const hebrewDate = useMemo<HebrewDateData | null>(() => {
    try {
      setError(null);
      
      // Create Hebrew date using @hebcal/core
      const hDate = new HDate(date);
      
      // Get Hebrew day in gematriya
      const hebrewDay = gematriya(hDate.getDate());
      
      // Get Hebrew month name
      const hebrewMonth = hebrewMonthNames[hDate.getMonth()] || 
        Locale.gettext(hDate.getMonthName(), 'he');
      
      // Get Hebrew year in gematriya
      const hebrewYear = gematriya(hDate.getFullYear());
      
      // Use built-in renderGematriya for full Hebrew date (without nikud for cleaner display)
      const hebrew = hDate.renderGematriya(true); // true = suppress nikud
      
      // Day of week in Hebrew
      const dayOfWeekNames = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
      const dayOfWeek = dayOfWeekNames[date.getDay()];
      
      // Format Gregorian date in Hebrew locale
      const gregorianFormatter = new Intl.DateTimeFormat('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      return {
        hebrew,
        hebrewDay,
        hebrewMonth,
        hebrewYear,
        gregorian: gregorianFormatter.format(date),
        dayOfWeek,
      };
    } catch (err) {
      console.error('Error calculating Hebrew date:', err);
      setError('לא הצלחנו לחשב את התאריך העברי');
      return null;
    }
  }, [date.getDate(), date.getMonth(), date.getFullYear()]);

  return {
    hebrewDate,
    loading: false, // No loading needed - calculation is synchronous
    error,
    refetch: () => {}, // No refetch needed - useMemo handles updates
  };
};
