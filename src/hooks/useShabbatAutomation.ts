import { useState, useEffect, useCallback, useRef } from 'react';
import { useShabbatTimes } from './useShabbatTimes';
import { useToast } from './use-toast';

export interface AutomationConfig {
  enabled: boolean;
  minutesBefore: number;
  onTrigger: () => Promise<void>;
  platformName: string;
}

const AUTOMATION_TRIGGERED_KEY = 'shabbat_automation_last_triggered';

export const useShabbatAutomation = (
  city: string,
  config: AutomationConfig
) => {
  const { shabbatTimes, loading, getMinutesUntilCandleLighting } = useShabbatTimes(city);
  const { toast } = useToast();
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearScheduledAutomation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsScheduled(false);
    setScheduledTime(null);
  }, []);

  const wasTriggeredThisWeek = useCallback((): boolean => {
    try {
      const lastTriggered = localStorage.getItem(AUTOMATION_TRIGGERED_KEY);
      if (!lastTriggered) return false;

      const lastDate = new Date(lastTriggered);
      const now = new Date();
      
      // Check if last triggered was within the last 6 days (to avoid triggering twice for same Shabbat)
      const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays < 6;
    } catch {
      return false;
    }
  }, []);

  const markAsTriggered = useCallback(() => {
    localStorage.setItem(AUTOMATION_TRIGGERED_KEY, new Date().toISOString());
  }, []);

  const scheduleAutomation = useCallback(() => {
    if (!config.enabled || !shabbatTimes?.candleLightingDate) {
      clearScheduledAutomation();
      return;
    }

    // Check if already triggered this week
    if (wasTriggeredThisWeek()) {
      console.log('Shabbat automation already triggered this week');
      return;
    }

    const candleTime = shabbatTimes.candleLightingDate;
    const triggerTime = new Date(candleTime.getTime() - config.minutesBefore * 60 * 1000);
    const now = new Date();

    // If trigger time already passed, don't schedule
    if (triggerTime.getTime() < now.getTime()) {
      console.log('Shabbat automation trigger time already passed');
      clearScheduledAutomation();
      return;
    }

    const delayMs = triggerTime.getTime() - now.getTime();

    // Clear any existing timeout
    clearScheduledAutomation();

    console.log(`Scheduling Shabbat automation for ${triggerTime.toLocaleString()} (in ${Math.round(delayMs / 60000)} minutes)`);

    timeoutRef.current = setTimeout(async () => {
      try {
        toast({
          title: `🕯️ ${config.platformName} - הכנה לשבת`,
          description: `מפעיל אוטומציה ${config.minutesBefore} דקות לפני הדלקת נרות`,
        });

        await config.onTrigger();
        markAsTriggered();

        toast({
          title: '✨ הבית מוכן לשבת!',
          description: 'הפעולות האוטומטיות בוצעו בהצלחה',
        });
      } catch (error) {
        console.error('Shabbat automation failed:', error);
        toast({
          title: 'שגיאה באוטומציה',
          description: 'חלק מהפעולות נכשלו',
          variant: 'destructive',
        });
      }

      setIsScheduled(false);
      setScheduledTime(null);
    }, delayMs);

    setIsScheduled(true);
    setScheduledTime(triggerTime);
  }, [config, shabbatTimes, clearScheduledAutomation, wasTriggeredThisWeek, markAsTriggered, toast]);

  // Schedule automation when config or shabbat times change
  useEffect(() => {
    scheduleAutomation();

    return () => {
      clearScheduledAutomation();
    };
  }, [scheduleAutomation, clearScheduledAutomation]);

  // Refresh every hour to keep schedule up to date
  useEffect(() => {
    const interval = setInterval(() => {
      scheduleAutomation();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [scheduleAutomation]);

  return {
    shabbatTimes,
    loading,
    isScheduled,
    scheduledTime,
    minutesUntilCandleLighting: getMinutesUntilCandleLighting(),
    reschedule: scheduleAutomation,
    cancelSchedule: clearScheduledAutomation,
  };
};
