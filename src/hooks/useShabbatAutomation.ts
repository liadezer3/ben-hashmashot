import { useState, useEffect, useCallback, useRef } from 'react';
import { useShabbatTimes } from './useShabbatTimes';
import { useToast } from './use-toast';
import { sendTestWebPushNotification, checkWebPushSubscription } from '@/lib/webPushNotifications';
import { supabase } from '@/integrations/supabase/client';

export interface AutomationConfig {
  enabled: boolean;
  minutesBefore: number;
  onTrigger: () => Promise<void>;
  platformName: string;
}

export interface MotzeiShabbatConfig {
  enabled: boolean;
  minutesAfter: number;
  onTrigger: () => Promise<void>;
  platformName: string;
}

const AUTOMATION_TRIGGERED_KEY = 'shabbat_automation_last_triggered';
const MOTZEI_AUTOMATION_TRIGGERED_KEY = 'motzei_shabbat_automation_last_triggered';

// Helper function to send push notification for automation events
const sendAutomationPushNotification = async (title: string, body: string) => {
  try {
    const isSubscribed = await checkWebPushSubscription();
    if (!isSubscribed) {
      console.log('User not subscribed to push notifications');
      return;
    }

    await supabase.functions.invoke('send-web-push', {
      body: { 
        test: true,
        title,
        body
      }
    });
  } catch (error) {
    console.error('Failed to send automation push notification:', error);
  }
};

export const useShabbatAutomation = (
  city: string,
  config: AutomationConfig,
  motzeiConfig?: MotzeiShabbatConfig
) => {
  const { shabbatTimes, loading, getMinutesUntilCandleLighting, getMinutesUntilHavdalah } = useShabbatTimes(city);
  const { toast } = useToast();
  
  // Erev Shabbat state
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Motzei Shabbat state
  const [motzeiScheduledTime, setMotzeiScheduledTime] = useState<Date | null>(null);
  const [isMotzeiScheduled, setIsMotzeiScheduled] = useState(false);
  const motzeiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear Erev Shabbat automation
  const clearScheduledAutomation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsScheduled(false);
    setScheduledTime(null);
  }, []);

  // Clear Motzei Shabbat automation
  const clearMotzeiAutomation = useCallback(() => {
    if (motzeiTimeoutRef.current) {
      clearTimeout(motzeiTimeoutRef.current);
      motzeiTimeoutRef.current = null;
    }
    setIsMotzeiScheduled(false);
    setMotzeiScheduledTime(null);
  }, []);

  const wasTriggeredThisWeek = useCallback((key: string): boolean => {
    try {
      const lastTriggered = localStorage.getItem(key);
      if (!lastTriggered) return false;

      const lastDate = new Date(lastTriggered);
      const now = new Date();
      
      // Check if last triggered was within the last 6 days
      const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays < 6;
    } catch {
      return false;
    }
  }, []);

  const markAsTriggered = useCallback((key: string) => {
    localStorage.setItem(key, new Date().toISOString());
  }, []);

  // Schedule Erev Shabbat automation
  const scheduleAutomation = useCallback(() => {
    if (!config.enabled || !shabbatTimes?.candleLightingDate) {
      clearScheduledAutomation();
      return;
    }

    if (wasTriggeredThisWeek(AUTOMATION_TRIGGERED_KEY)) {
      console.log('Shabbat automation already triggered this week');
      return;
    }

    const candleTime = shabbatTimes.candleLightingDate;
    const triggerTime = new Date(candleTime.getTime() - config.minutesBefore * 60 * 1000);
    const now = new Date();

    if (triggerTime.getTime() < now.getTime()) {
      console.log('Shabbat automation trigger time already passed');
      clearScheduledAutomation();
      return;
    }

    const delayMs = triggerTime.getTime() - now.getTime();
    clearScheduledAutomation();

    console.log(`Scheduling Shabbat automation for ${triggerTime.toLocaleString()} (in ${Math.round(delayMs / 60000)} minutes)`);

    timeoutRef.current = setTimeout(async () => {
      try {
        // Show toast notification
        toast({
          title: `🕯️ ${config.platformName} - הכנה לשבת`,
          description: `מפעיל אוטומציה ${config.minutesBefore} דקות לפני הדלקת נרות`,
        });

        // Send push notification
        sendAutomationPushNotification(
          `🕯️ ${config.platformName} - הכנה לשבת`,
          `מפעיל אוטומציה ${config.minutesBefore} דקות לפני הדלקת נרות`
        );

        await config.onTrigger();
        markAsTriggered(AUTOMATION_TRIGGERED_KEY);

        toast({
          title: '✨ הבית מוכן לשבת!',
          description: 'הפעולות האוטומטיות בוצעו בהצלחה',
        });

        // Send success push notification
        sendAutomationPushNotification(
          '✨ הבית מוכן לשבת!',
          'הפעולות האוטומטיות בוצעו בהצלחה'
        );
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

  // Schedule Motzei Shabbat automation
  const scheduleMotzeiAutomation = useCallback(() => {
    if (!motzeiConfig?.enabled || !shabbatTimes?.havdalahDate) {
      clearMotzeiAutomation();
      return;
    }

    if (wasTriggeredThisWeek(MOTZEI_AUTOMATION_TRIGGERED_KEY)) {
      console.log('Motzei Shabbat automation already triggered this week');
      return;
    }

    const havdalahTime = shabbatTimes.havdalahDate;
    const triggerTime = new Date(havdalahTime.getTime() + motzeiConfig.minutesAfter * 60 * 1000);
    const now = new Date();

    if (triggerTime.getTime() < now.getTime()) {
      console.log('Motzei Shabbat automation trigger time already passed');
      clearMotzeiAutomation();
      return;
    }

    const delayMs = triggerTime.getTime() - now.getTime();
    clearMotzeiAutomation();

    console.log(`Scheduling Motzei Shabbat automation for ${triggerTime.toLocaleString()} (in ${Math.round(delayMs / 60000)} minutes)`);

    motzeiTimeoutRef.current = setTimeout(async () => {
      try {
        // Show toast notification
        toast({
          title: `🌙 ${motzeiConfig.platformName} - מוצאי שבת`,
          description: `מפעיל אוטומציה ${motzeiConfig.minutesAfter} דקות אחרי הבדלה`,
        });

        // Send push notification
        sendAutomationPushNotification(
          `🌙 ${motzeiConfig.platformName} - מוצאי שבת`,
          `מפעיל אוטומציה ${motzeiConfig.minutesAfter} דקות אחרי הבדלה`
        );

        await motzeiConfig.onTrigger();
        markAsTriggered(MOTZEI_AUTOMATION_TRIGGERED_KEY);

        toast({
          title: '✨ שבוע טוב!',
          description: 'האורות הודלקו בהצלחה',
        });

        // Send success push notification
        sendAutomationPushNotification(
          '✨ שבוע טוב!',
          'האורות הודלקו בהצלחה'
        );
      } catch (error) {
        console.error('Motzei Shabbat automation failed:', error);
        toast({
          title: 'שגיאה באוטומציה',
          description: 'חלק מהפעולות נכשלו',
          variant: 'destructive',
        });
      }

      setIsMotzeiScheduled(false);
      setMotzeiScheduledTime(null);
    }, delayMs);

    setIsMotzeiScheduled(true);
    setMotzeiScheduledTime(triggerTime);
  }, [motzeiConfig, shabbatTimes, clearMotzeiAutomation, wasTriggeredThisWeek, markAsTriggered, toast]);

  // Schedule both automations when config or shabbat times change
  useEffect(() => {
    scheduleAutomation();
    scheduleMotzeiAutomation();

    return () => {
      clearScheduledAutomation();
      clearMotzeiAutomation();
    };
  }, [scheduleAutomation, scheduleMotzeiAutomation, clearScheduledAutomation, clearMotzeiAutomation]);

  // Refresh every hour to keep schedule up to date
  useEffect(() => {
    const interval = setInterval(() => {
      scheduleAutomation();
      scheduleMotzeiAutomation();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [scheduleAutomation, scheduleMotzeiAutomation]);

  return {
    shabbatTimes,
    loading,
    // Erev Shabbat
    isScheduled,
    scheduledTime,
    minutesUntilCandleLighting: getMinutesUntilCandleLighting(),
    reschedule: scheduleAutomation,
    cancelSchedule: clearScheduledAutomation,
    // Motzei Shabbat
    isMotzeiScheduled,
    motzeiScheduledTime,
    minutesUntilHavdalah: getMinutesUntilHavdalah(),
    rescheduleMotzei: scheduleMotzeiAutomation,
    cancelMotzeiSchedule: clearMotzeiAutomation,
  };
};
