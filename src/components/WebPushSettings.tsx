import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Loader2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  isWebPushSupported,
  requestWebPushPermission,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  checkWebPushSubscription,
  saveSubscriptionToDatabase,
  sendTestWebPushNotification,
} from "@/lib/webPushNotifications";

// VAPID public key - should match the one in edge function secrets
const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa40HI9X5jzP_PGaXg_T0z2PXQQQ9WNhT5n7zP1bGPGfWTqW7FGDwKr4qmE4jk";

export const WebPushSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkSupport = async () => {
      const supported = isWebPushSupported();
      setIsSupported(supported);
      
      if (supported) {
        const subscribed = await checkWebPushSubscription();
        setIsSubscribed(subscribed);
      }
      
      setLoading(false);
    };

    checkSupport();
  }, []);

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
    <Card className="p-4">
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
      {isSubscribed && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check className="w-4 h-4" />
          <span>התראות Push מופעלות</span>
        </div>
      )}
    </Card>
  );
};
