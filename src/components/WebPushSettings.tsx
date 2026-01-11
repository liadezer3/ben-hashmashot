import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Loader2, Check, AlertCircle, Clock, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  isWebPushSupported,
  requestWebPushPermission,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  checkWebPushSubscription,
  saveSubscriptionToDatabase,
  sendTestWebPushNotification,
} from "@/lib/webPushNotifications";

// VAPID public key - matches the one in Supabase secrets
const VAPID_PUBLIC_KEY = "BIXklk4iVQgE4UUVB5eM5PrxpdvM2M_W6xKqg91b1HjF2PsnhbetNNVaxJdpgYp9uRhvu491o6HVdDZIkeWby8I";

// Generate hours for select
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    const formatted = `${hour.toString().padStart(2, '0')}:00`;
    options.push(formatted);
  }
  return options;
};

export const WebPushSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [hoursBeforeShabbat, setHoursBeforeShabbat] = useState(2);
  const [savingTime, setSavingTime] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkSupport = async () => {
      const supported = isWebPushSupported();
      setIsSupported(supported);
      
      if (supported) {
        const subscribed = await checkWebPushSubscription();
        setIsSubscribed(subscribed);
      }
      
      // Load saved notification time
      await loadNotificationTime();
      
      setLoading(false);
    };

    checkSupport();
  }, []);

  const loadNotificationTime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notification_preferences')
        .select('morning_time, hours_before_shabbat')
        .eq('user_id', user.id)
        .single();

      if (data?.morning_time) {
        setNotificationTime(data.morning_time);
      }
      if (data?.hours_before_shabbat !== null && data?.hours_before_shabbat !== undefined) {
        setHoursBeforeShabbat(data.hours_before_shabbat);
      }
    } catch (error) {
      console.error('Error loading notification time:', error);
    }
  };

  const handleHoursChange = async (hours: string) => {
    const hoursNum = parseInt(hours);
    setHoursBeforeShabbat(hoursNum);
    setSavingHours(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "יש להתחבר",
          description: "התחבר כדי לשמור את ההגדרות",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          hours_before_shabbat: hoursNum,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "✅ ההגדרה נשמרה",
        description: `תקבל התראה ${hoursNum} שעות לפני כניסת שבת`,
      });
    } catch (error: any) {
      console.error('Error saving hours before shabbat:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את ההגדרה",
        variant: "destructive",
      });
    } finally {
      setSavingHours(false);
    }
  };

  const handleTimeChange = async (time: string) => {
    setNotificationTime(time);
    setSavingTime(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "יש להתחבר",
          description: "התחבר כדי לשמור את השעה המועדפת",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          morning_time: time,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "✅ השעה נשמרה",
        description: `תקבל התראות בשעה ${time}`,
      });
    } catch (error: any) {
      console.error('Error saving notification time:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את השעה",
        variant: "destructive",
      });
    } finally {
      setSavingTime(false);
    }
  };

  const handleToggleSubscription = async () => {
    setSubscribing(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const success = await unsubscribeFromWebPush();
        if (success) {
          setIsSubscribed(false);
          toast({
            title: "ביטלת את המנוי להתראות",
            description: "לא תקבל יותר התראות Push בדפדפן",
          });
        } else {
          throw new Error("Failed to unsubscribe");
        }
      } else {
        // Subscribe
        const permissionGranted = await requestWebPushPermission();
        if (!permissionGranted) {
          toast({
            title: "נדרשת הרשאה",
            description: "יש לאפשר התראות כדי לקבל עדכונים",
            variant: "destructive",
          });
          return;
        }

        const subscription = await subscribeToWebPush(VAPID_PUBLIC_KEY);
        if (!subscription) {
          throw new Error("Failed to subscribe");
        }

        const saved = await saveSubscriptionToDatabase(subscription);
        if (!saved) {
          throw new Error("Failed to save subscription");
        }

        setIsSubscribed(true);
        toast({
          title: "✅ נרשמת להתראות",
          description: "תקבל התראות Push על זמני שבת וחג",
        });
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את הגדרות ההתראות",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleTestNotification = async () => {
    if (!isSubscribed) {
      toast({
        title: "יש להירשם קודם",
        description: "הפעל את התראות Push לפני שליחת בדיקה",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);

    try {
      const success = await sendTestWebPushNotification();
      if (success) {
        toast({
          title: "✅ התראת בדיקה נשלחה",
          description: "בדוק את הודעות הדפדפן",
        });
      } else {
        throw new Error("Failed to send test");
      }
    } catch (error: any) {
      console.error("Test notification error:", error);
      toast({
        title: "שגיאה בשליחת בדיקה",
        description: error.message || "לא הצלחנו לשלוח התראת בדיקה",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>בודק תמיכה בהתראות...</span>
        </div>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">התראות Push לא נתמכות</p>
            <p className="text-sm text-muted-foreground">
              הדפדפן שלך לא תומך בהתראות Push. נסה דפדפן אחר או את האפליקציה המותקנת.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <Label className="text-base cursor-pointer" htmlFor="web-push-toggle">
              התראות Push בדפדפן
            </Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? "מופעל - תקבל התראות בדפדפן" : "מושבת - הפעל לקבלת התראות"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "בדיקה"
              )}
            </Button>
          )}
          <Switch
            id="web-push-toggle"
            checked={isSubscribed}
            onCheckedChange={handleToggleSubscription}
            disabled={subscribing}
          />
        </div>
      </div>

      {/* Time Selector - Only show when subscribed */}
      {isSubscribed && (
        <div className="border-t pt-4 space-y-4">
          {/* Daily notification time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <Label className="text-base">שעת קבלת התראות</Label>
                <p className="text-sm text-muted-foreground">
                  בחר את השעה המועדפת לקבלת התראות יומיות
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {savingTime && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Select value={notificationTime} onValueChange={handleTimeChange} disabled={savingTime}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="בחר שעה" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeOptions().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hours before Shabbat */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-orange-500" />
              <div>
                <Label className="text-base">התראה לפני כניסת שבת</Label>
                <p className="text-sm text-muted-foreground">
                  קבל תזכורת לפני כניסת השבת
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {savingHours && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Select value={hoursBeforeShabbat.toString()} onValueChange={handleHoursChange} disabled={savingHours}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="בחר זמן" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">שעה אחת</SelectItem>
                  <SelectItem value="2">שעתיים</SelectItem>
                  <SelectItem value="3">3 שעות</SelectItem>
                  <SelectItem value="4">4 שעות</SelectItem>
                  <SelectItem value="6">6 שעות</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {isSubscribed && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check className="w-4 h-4" />
          <span>התראות Push מופעלות</span>
        </div>
      )}
    </Card>
  );
};