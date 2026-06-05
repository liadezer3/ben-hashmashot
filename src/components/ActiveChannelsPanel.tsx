import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, Smartphone, Send, Loader2, Settings as SettingsIcon, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  isWebPushSupported,
  requestWebPushPermission,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  checkWebPushSubscription,
  saveSubscriptionToDatabase,
} from "@/lib/webPushNotifications";
import {
  isLocalNotificationsSupported,
  enableLocalNotifications,
  checkLocalNotificationsEnabled,
  sendLocalTestNotification,
} from "@/lib/localNotifications";

const VAPID_PUBLIC_KEY =
  "BIXklk4iVQgE4UUVB5eM5PrxpdvM2M_W6xKqg91b1HjF2PsnhbetNNVaxJdpgYp9uRhvu491o6HVdDZIkeWby8I";

const LOCAL_PREF_KEY = "local_notifications_enabled";

type ChannelKey = "push" | "local" | "email" | "whatsapp" | "sms" | "telegram";

interface ChannelDef {
  key: ChannelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dbField: string;
}

const CHANNELS: ChannelDef[] = [
  { key: "push", label: "התראות בדפדפן (Push)", icon: Bell, dbField: "push_enabled" },
  { key: "local", label: "התראות מקומיות במכשיר", icon: Smartphone, dbField: "" },
  { key: "email", label: "אימייל", icon: Mail, dbField: "email_enabled" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare, dbField: "whatsapp_enabled" },
  { key: "sms", label: "SMS", icon: Smartphone, dbField: "sms_enabled" },
  { key: "telegram", label: "Telegram", icon: Send, dbField: "telegram_enabled" },
];

export const ActiveChannelsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [togglingPush, setTogglingPush] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [localSupported, setLocalSupported] = useState(true);
  const [togglingLocal, setTogglingLocal] = useState(false);
  const [channels, setChannels] = useState<Record<ChannelKey, boolean>>({
    push: false,
    local: false,
    email: false,
    whatsapp: false,
    sms: false,
    telegram: false,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const supported = isWebPushSupported();
    setPushSupported(supported);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let actuallySubscribed = false;
    if (supported) {
      actuallySubscribed = await checkWebPushSubscription();
      setPushSubscribed(actuallySubscribed);
    }

    const localOk = isLocalNotificationsSupported();
    setLocalSupported(localOk);
    let localEnabled = false;
    if (localOk) {
      const granted = await checkLocalNotificationsEnabled();
      localEnabled = granted && localStorage.getItem(LOCAL_PREF_KEY) === "true";
    }

    if (data) {
      const d = data as any;
      setChannels({
        push: actuallySubscribed && (d.push_enabled ?? true),
        local: localEnabled,
        email: d.email_enabled ?? false,
        whatsapp: d.whatsapp_enabled ?? false,
        sms: d.sms_enabled ?? false,
        telegram: d.telegram_enabled ?? false,
      });
    } else {
      setChannels((c) => ({ ...c, push: actuallySubscribed, local: localEnabled }));
    }
    setLoading(false);
  };

  const updatePrefField = async (field: string, value: boolean) => {
    if (!userId) return { error: new Error("not authenticated") } as any;
    return await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: userId, [field]: value } as any,
        { onConflict: "user_id" }
      );
  };

  const handleTogglePush = async (value: boolean) => {
    if (!pushSupported) {
      toast({
        title: "הדפדפן לא תומך",
        description: "התראות Push אינן נתמכות בדפדפן זה. נסה Chrome / Edge / Firefox.",
        variant: "destructive",
      });
      return;
    }
    setTogglingPush(true);
    try {
      if (value) {
        const granted = await requestWebPushPermission();
        if (!granted) {
          toast({
            title: "הרשאה נדחתה",
            description: "יש לאפשר התראות בדפדפן (סמל המנעול → התראות → אפשר)",
            variant: "destructive",
          });
          return;
        }
        const sub = await subscribeToWebPush(VAPID_PUBLIC_KEY);
        if (!sub) throw new Error("נכשל יצירת מנוי Push");
        const saved = await saveSubscriptionToDatabase(sub);
        if (!saved) throw new Error("נכשלה שמירת המנוי במסד הנתונים");
        await updatePrefField("push_enabled", true);
        setPushSubscribed(true);
        setChannels((c) => ({ ...c, push: true }));
        toast({ title: "✅ התראות Push הופעלו" });
      } else {
        await unsubscribeFromWebPush();
        await updatePrefField("push_enabled", false);
        setPushSubscribed(false);
        setChannels((c) => ({ ...c, push: false }));
        toast({ title: "התראות Push כובו" });
      }
    } catch (e: any) {
      toast({
        title: "שגיאה",
        description: e.message || "לא הצלחנו לעדכן את הרשמת ה-Push",
        variant: "destructive",
      });
    } finally {
      setTogglingPush(false);
    }
  };

  const handleToggleLocal = async (value: boolean) => {
    if (!localSupported) {
      toast({
        title: "לא נתמך",
        description: "התראות מקומיות אינן נתמכות במכשיר/דפדפן זה.",
        variant: "destructive",
      });
      return;
    }
    setTogglingLocal(true);
    try {
      if (value) {
        const granted = await enableLocalNotifications();
        if (!granted) {
          toast({
            title: "הרשאה נדחתה",
            description: "יש לאפשר התראות במכשיר כדי לקבל התראות מקומיות.",
            variant: "destructive",
          });
          return;
        }
        localStorage.setItem(LOCAL_PREF_KEY, "true");
        setChannels((c) => ({ ...c, local: true }));
        await sendLocalTestNotification("בין השמשות", "התראות מקומיות הופעלו ✅");
        toast({ title: "✅ התראות מקומיות הופעלו" });
      } else {
        localStorage.setItem(LOCAL_PREF_KEY, "false");
        setChannels((c) => ({ ...c, local: false }));
        toast({ title: "התראות מקומיות כובו" });
      }
    } catch (e: any) {
      toast({
        title: "שגיאה",
        description: e.message || "לא הצלחנו לעדכן את ההתראות המקומיות",
        variant: "destructive",
      });
    } finally {
      setTogglingLocal(false);
    }
  };

  const handleToggle = async (key: ChannelKey, value: boolean) => {
    if (key === "push") {
      await handleTogglePush(value);
      return;
    }
    if (key === "local") {
      await handleToggleLocal(value);
      return;
    }
    if (!userId) return;
    const prev = channels[key];
    setChannels((c) => ({ ...c, [key]: value }));

    const field = CHANNELS.find((c) => c.key === key)!.dbField;
    const { error } = await updatePrefField(field, value);

    if (error) {
      setChannels((c) => ({ ...c, [key]: prev }));
      toast({ title: "שגיאה בעדכון", description: error.message, variant: "destructive" });
    } else {
      toast({ title: value ? "הערוץ הופעל" : "הערוץ כובה" });
    }
  };

  const handleTestAll = async () => {
    const active = CHANNELS.filter((c) => channels[c.key]);
    if (active.length === 0) {
      toast({
        title: "אין ערוצים פעילים",
        description: "הפעילו לפחות ערוץ אחד כדי לבדוק שליחה",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("scheduled-push", {
        body: { test: true, testType: "scheduled" },
      });

      if (error) throw error;

      const parts: string[] = [];
      if (data?.pushSent !== undefined) parts.push(`Push: ${data.pushSent > 0 ? "✓" : "✗"}`);
      if (data?.emailSent !== undefined) parts.push(`Email: ${data.emailSent > 0 ? "✓" : "✗"}`);
      if (data?.whatsappSent !== undefined) parts.push(`WhatsApp: ${data.whatsappSent > 0 ? "✓" : "✗"}`);
      if (data?.smsSent !== undefined) parts.push(`SMS: ${data.smsSent > 0 ? "✓" : "✗"}`);
      if (data?.telegramSent !== undefined) parts.push(`Telegram: ${data.telegramSent > 0 ? "✓" : "✗"}`);

      toast({
        title: "בדיקה הושלמה",
        description: parts.join(" | ") || "התזמון הופעל",
      });
    } catch (e: any) {
      toast({
        title: "שגיאה בבדיקה",
        description: e.message || "לא הצלחנו להריץ את הבדיקה",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const activeCount = Object.values(channels).filter(Boolean).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          ערוצי התראה
          <span className="text-xs text-muted-foreground font-normal">
            ({activeCount} פעילים)
          </span>
        </h3>
        <Link
          to="/settings?tab=notifications"
          className="text-muted-foreground hover:text-primary"
          aria-label="הגדרות התראות"
        >
          <SettingsIcon className="w-5 h-5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const enabled = channels[ch.key];
              const isPush = ch.key === "push";
              const isLocal = ch.key === "local";
              const pushBlocked = isPush && !pushSupported;
              const localBlocked = isLocal && !localSupported;
              const blocked = pushBlocked || localBlocked;
              return (
                <div
                  key={ch.key}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <div className={`text-sm ${enabled ? "" : "text-muted-foreground"}`}>
                        {ch.label}
                      </div>
                      {blocked && (
                        <div className="text-[10px] text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> לא נתמך במכשיר זה
                        </div>
                      )}
                      {isPush && pushSupported && !pushSubscribed && enabled === false && (
                        <div className="text-[10px] text-muted-foreground">
                          הפעלה תבקש הרשאה מהדפדפן
                        </div>
                      )}
                      {isLocal && localSupported && enabled === false && (
                        <div className="text-[10px] text-muted-foreground">
                          התראות על המכשיר, פועלות גם ללא חיבור
                        </div>
                      )}
                    </div>
                  </div>
                  {(isPush && togglingPush) || (isLocal && togglingLocal) ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      checked={enabled}
                      onCheckedChange={(v) => handleToggle(ch.key, v)}
                      disabled={blocked}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleTestAll}
            disabled={testing || activeCount === 0}
            className="w-full gap-2"
            variant="default"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {testing ? "שולח בדיקה..." : "בדוק תזמון לכל הערוצים הפעילים"}
          </Button>
        </>
      )}
    </Card>
  );
};

export default ActiveChannelsPanel;
