import { useState, useEffect } from "react";
import { Clock, Calendar, Bell, Mail, MessageSquare } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp-icon.png";

interface NextNotificationDisplayProps {
  settings: {
    email: boolean;
    whatsapp: boolean;
    sms?: boolean;
    push: boolean;
  };
  timeSettings: {
    morningTime: string;
    daysBeforeShabbat: number;
    shabbatReminderTime: string;
    hoursBeforeShabbat: number;
  };
}

export const NextNotificationDisplay = ({ settings, timeSettings }: NextNotificationDisplayProps) => {
  const [nextNotificationInfo, setNextNotificationInfo] = useState<{
    date: Date | null;
    type: 'morning' | 'shabbat_reminder' | 'hours_before';
    description: string;
  } | null>(null);

  useEffect(() => {
    calculateNextNotification();
    // Update every minute
    const interval = setInterval(calculateNextNotification, 60000);
    return () => clearInterval(interval);
  }, [settings, timeSettings]);

  const calculateNextNotification = () => {
    const now = new Date();
    const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    
    // Find next Friday
    const daysUntilFriday = (5 - israelTime.getDay() + 7) % 7;
    const nextFriday = new Date(israelTime);
    nextFriday.setDate(israelTime.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    
    // Calculate notification day based on days_before_shabbat
    const notificationDay = new Date(nextFriday);
    notificationDay.setDate(nextFriday.getDate() - timeSettings.daysBeforeShabbat);
    
    // Set the reminder time
    const [hours, minutes] = timeSettings.shabbatReminderTime.split(':').map(Number);
    notificationDay.setHours(hours, minutes, 0, 0);
    
    // If the calculated time already passed this week, move to next week
    if (notificationDay.getTime() < israelTime.getTime()) {
      notificationDay.setDate(notificationDay.getDate() + 7);
    }

    const dayNames = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
    const dayName = dayNames[notificationDay.getDay()];
    
    const timeDiff = notificationDay.getTime() - israelTime.getTime();
    const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let description = '';
    if (hoursUntil < 1) {
      description = `בעוד ${minutesUntil} דקות`;
    } else if (hoursUntil < 24) {
      description = `בעוד ${hoursUntil} שעות ו-${minutesUntil} דקות`;
    } else {
      const days = Math.floor(hoursUntil / 24);
      const remainingHours = hoursUntil % 24;
      description = days === 1 
        ? `מחר בשעה ${timeSettings.shabbatReminderTime}`
        : `${dayName} (${days} ימים) בשעה ${timeSettings.shabbatReminderTime}`;
    }

    setNextNotificationInfo({
      date: notificationDay,
      type: 'shabbat_reminder',
      description
    });
  };

  // Check if any notification channel is enabled
  const hasAnyChannelEnabled = settings.email || settings.whatsapp || settings.push;

  if (!hasAnyChannelEnabled) {
    return (
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bell className="w-5 h-5" />
          <span className="text-sm">לא הופעלו ערוצי התראות - הפעל לפחות ערוץ אחד כדי לקבל התראות אוטומטיות</span>
        </div>
      </div>
    );
  }

  if (!nextNotificationInfo?.date) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('he-IL', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground">ההתראה הבאה</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {nextNotificationInfo.description}
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground mr-6">
          {formatDate(nextNotificationInfo.date)} בשעה {timeSettings.shabbatReminderTime}
        </p>
        
        {/* Active channels */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-muted-foreground">ערוצים פעילים:</span>
          {settings.email && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-xs text-primary">
              <Mail className="w-3 h-3" /> מייל
            </span>
          )}
          {settings.push && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-xs text-primary">
              <Bell className="w-3 h-3" /> Push
            </span>
          )}
          {settings.sms && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs text-secondary-foreground">
              <MessageSquare className="w-3 h-3" /> SMS
            </span>
          )}
          {settings.whatsapp && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs text-secondary-foreground">
              <img src={whatsappIcon} alt="" className="w-3 h-3" /> WhatsApp
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
