import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, Smartphone, Send, Loader2, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ChannelKey = "push" | "email" | "whatsapp" | "sms" | "telegram";

interface ChannelDef {
  key: ChannelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dbField: string;
}

const CHANNELS: ChannelDef[] = [
  { key: "push", label: "התראות Push", icon: Bell, dbField: "push_enabled" },
  { key: "email", label: "אימייל", icon: Mail, dbField: "email_enabled" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare, dbField: "whatsapp_enabled" },
  { key: "sms", label: "SMS", icon: Smartphone, dbField: "sms_enabled" },
  { key: "telegram", label: "Telegram", icon: Send, dbField: "telegram_enabled" },
];

export const ActiveChannelsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Record<ChannelKey, boolean>>({
    push: false,
    email: false,
    whatsapp: false,
    sms: false,
    telegram: false,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
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

    if (data) {
      const d = data as any;
      setChannels({
        push: d.push_enabled ?? false,
        email: d.email_enabled ?? false,
        whatsapp: d.whatsapp_enabled ?? false,
        sms: d.sms_enabled ?? false,
        telegram: d.telegram_enabled ?? false,
      });
    }
    setLoading(false);
  };

  const handleToggle = async (key: ChannelKey, value: boolean) => {
    if (!userId) return;
    const prev = channels[key];
    setChannels((c) => ({ ...c, [key]: value }));

    const field = CHANNELS.find((c) => c.key === key)!.dbField;
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: userId, [field]: value } as any,
        { onConflict: "user_id" }
      );

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
              return (
                <div
                  key={ch.key}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm ${enabled ? "" : "text-muted-foreground"}`}>
                      {ch.label}
                    </span>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(v) => handleToggle(ch.key, v)}
                  />
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
