import { useState, useEffect, useMemo } from 'react';
import { HDate, HebrewCalendar, Event } from '@hebcal/core';

export type ShabbatModePhase = 
  | 'weekday'           // ימות השבוע (ראשון-רביעי)
  | 'pre-shabbat-early' // יום חמישי או שישי בוקר - פונקציונלי
  | 'pre-shabbat-prep'  // יום שישי אחה״צ - להתכונן
  | 'pre-shabbat-rush'  // שעה אחרונה לפני שבת - לחוץ
  | 'shabbat'           // שבת - רגוע
  | 'motzei-shabbat';   // מוצאי שבת

export interface ShabbatModeData {
  phase: ShabbatModePhase;
  isFriday: boolean;
  isShabbat: boolean;
  isErevChag: boolean;
  isChag: boolean;
  candleLightingTime: Date | null;
  havdalahTime: Date | null;
  minutesToCandles: number | null;
  minutesToHavdalah: number | null;
  showPutDownPhone: boolean;
  phaseLabel: string;
  phaseEmoji: string;
}

// Calculate Israel time
const getIsraelTime = (): Date => {
  const now = new Date();
  const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  return israelTime;
};

// Parse time string like "18:30" to Date object for today
const parseTimeToDate = (timeStr: string, baseDate: Date): Date | null => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  
  const result = new Date(baseDate);
  result.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
  return result;
};

export const useShabbatMode = (candleLightingStr?: string, havdalahStr?: string) => {
  const [now, setNow] = useState(getIsraelTime());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(getIsraelTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const modeData = useMemo<ShabbatModeData>(() => {
    const dayOfWeek = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
    const hour = now.getHours();
    
    // Parse candle lighting and havdalah times
    const candleLightingTime = candleLightingStr ? parseTimeToDate(candleLightingStr, now) : null;
    const havdalahTime = havdalahStr ? parseTimeToDate(havdalahStr, now) : null;

    // Calculate minutes to events
    let minutesToCandles: number | null = null;
    let minutesToHavdalah: number | null = null;

    if (candleLightingTime) {
      const candleTarget = new Date(candleLightingTime);
      // If it's already past candle lighting on Friday, calculate for next week
      if (dayOfWeek === 5 && now > candleLightingTime) {
        // Already Shabbat or past candle lighting
      } else if (dayOfWeek === 6) {
        // It's Shabbat
      } else {
        // Calculate days until Friday
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        candleTarget.setDate(now.getDate() + daysUntilFriday);
        minutesToCandles = Math.floor((candleTarget.getTime() - now.getTime()) / 60000);
      }
      
      // For Friday, calculate remaining time
      if (dayOfWeek === 5 && now < candleLightingTime) {
        minutesToCandles = Math.floor((candleLightingTime.getTime() - now.getTime()) / 60000);
      }
    }

    if (havdalahTime && dayOfWeek === 6) {
      if (now < havdalahTime) {
        minutesToHavdalah = Math.floor((havdalahTime.getTime() - now.getTime()) / 60000);
      }
    }

    // Determine phase
    let phase: ShabbatModePhase;
    let phaseLabel: string;
    let phaseEmoji: string;
    let showPutDownPhone = false;

    const isFriday = dayOfWeek === 5;
    const isShabbat = dayOfWeek === 6;
    const isThursday = dayOfWeek === 4;

    // Check if currently Shabbat (after candle lighting, before havdalah)
    const isCurrentlyShabbat = (
      (isFriday && candleLightingTime && now >= candleLightingTime) ||
      (isShabbat && havdalahTime && now < havdalahTime)
    );

    const isMotzeiShabbat = isShabbat && havdalahTime && now >= havdalahTime;

    if (isCurrentlyShabbat) {
      phase = 'shabbat';
      phaseLabel = 'שבת שלום!';
      phaseEmoji = '🕯️';
      showPutDownPhone = true;
    } else if (isMotzeiShabbat) {
      phase = 'motzei-shabbat';
      phaseLabel = 'שבוע טוב!';
      phaseEmoji = '✨';
    } else if (isFriday) {
      if (minutesToCandles !== null && minutesToCandles <= 60) {
        phase = 'pre-shabbat-rush';
        phaseLabel = 'הזמן אוזל!';
        phaseEmoji = '⏰';
        showPutDownPhone = true;
      } else if (hour >= 12) {
        phase = 'pre-shabbat-prep';
        phaseLabel = 'ההכנות בעיצומן';
        phaseEmoji = '🍳';
      } else {
        phase = 'pre-shabbat-early';
        phaseLabel = 'בוקר שישי';
        phaseEmoji = '☀️';
      }
    } else if (isThursday) {
      phase = 'pre-shabbat-early';
      phaseLabel = 'שישי מתקרב';
      phaseEmoji = '📋';
    } else {
      phase = 'weekday';
      phaseLabel = 'ימי השבוע';
      phaseEmoji = '📅';
    }

    // Check for holidays using hebcal
    const hDate = new HDate(now);
    const events = HebrewCalendar.getHolidaysOnDate(hDate) || [];
    const isChag = events.some((e: Event) => 
      (e.getFlags() & (0x04 | 0x02)) !== 0 // CHAG or LIGHT_CANDLES
    );
    const isErevChag = events.some((e: Event) => {
      const desc = e.getDesc();
      return desc.includes('Erev') || desc.includes('ערב');
    });

    return {
      phase,
      isFriday,
      isShabbat,
      isErevChag,
      isChag,
      candleLightingTime,
      havdalahTime,
      minutesToCandles,
      minutesToHavdalah,
      showPutDownPhone,
      phaseLabel,
      phaseEmoji,
    };
  }, [now, candleLightingStr, havdalahStr]);

  return modeData;
};

// CSS class mappings for different phases
export const getPhaseStyles = (phase: ShabbatModePhase) => {
  switch (phase) {
    case 'shabbat':
      return {
        bgClass: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30',
        accentClass: 'text-amber-600 dark:text-amber-400',
        borderClass: 'border-amber-200 dark:border-amber-800',
      };
    case 'pre-shabbat-rush':
      return {
        bgClass: 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
        accentClass: 'text-orange-600 dark:text-orange-400',
        borderClass: 'border-orange-200 dark:border-orange-800',
      };
    case 'pre-shabbat-prep':
      return {
        bgClass: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
        accentClass: 'text-yellow-600 dark:text-yellow-400',
        borderClass: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'pre-shabbat-early':
      return {
        bgClass: 'bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30',
        accentClass: 'text-sky-600 dark:text-sky-400',
        borderClass: 'border-sky-200 dark:border-sky-800',
      };
    case 'motzei-shabbat':
      return {
        bgClass: 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30',
        accentClass: 'text-purple-600 dark:text-purple-400',
        borderClass: 'border-purple-200 dark:border-purple-800',
      };
    default:
      return {
        bgClass: 'bg-background',
        accentClass: 'text-primary',
        borderClass: 'border-border',
      };
  }
};
