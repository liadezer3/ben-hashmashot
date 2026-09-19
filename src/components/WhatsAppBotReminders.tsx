import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_CITIES } from "@/lib/cities";

interface BotReminder {
  id: string;
  phone: string;
  city: string;
  label: string | null;
  is_active: boolean;
  thursday_enabled: boolean;
  thursday_time: string;
  friday_enabled: boolean;
  friday_time: string;
  before_candles_enabled: boolean;
  minutes_before_candles: number;
}

const trimTime = (t: string) => (t ? t.slice(0, 5) : "");

export const WhatsAppBotReminders = () => {
  const [reminder, setReminder] = useState<BotReminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("whatsapp_bot_reminders")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to load bot reminders:", error);
      } else if (data) {
        setReminder({
          ...(data as BotReminder),
          thursday_time: trimTime((data as BotReminder).thursday_time),
          friday_time: trimTime((data as BotReminder).friday_time),
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = (patch: Partial<BotReminder>) =>
    setReminder((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!reminder) return;
    setSaving(true);
    const { error } = await supabase
      .from("whatsapp_bot_reminders")
      .update({
        phone: reminder.phone,
        city: reminder.city,
        is_active: reminder.is_active,
        thursday_enabled: reminder.thursday_enabled,
        thursday_time: reminder.thursday_time,
        friday_enabled: reminder.friday_enabled,
        friday_time: reminder.friday_time,
        before_candles_enabled: reminder.before_candles_enabled,
        minutes_before_candles: reminder.minutes_before_candles,
      })
      .eq("id", reminder.id);
    setSaving(false);

    if (error) {
      toast.error(`שמירה נכשלה: ${error.message}`);
    } else {
      toast.success("ההגדרות נשמרו");
    }
  };

  const sendTest = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("scheduled-push", {
      body: { test: true, testType: "bot_reminder", kind: "friday" },
    });
    setTesting(false);

    if (error) {
      toast.error("שליחת הבדיקה נכשלה");
      return;
    }
    if (data?.success) {
      toast.success("נשלחה תזכורת בדיקה לוואטסאפ");
    } else {
      const firstError = data?.results?.[0]?.error || "לא ידוע";
      toast.error(`ההודעה לא נשלחה: ${firstError.slice(0, 140)}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!reminder) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            תזכורות לבוט בוואטסאפ
          </CardTitle>
          <CardDescription>
            אין הרשאה לצפות בהגדרות אלו, או שלא הוגדר נמען. הגדרות אלו זמינות למנהלי המערכת.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-primary" />
          תזכורות לבוט בוואטסאפ
        </CardTitle>
        <CardDescription>
          תזכורות שבת אוטומטיות שנשלחות למספר קבוע, גם ללא חשבון משתמש.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="bot-active">התזכורות פעילות</Label>
          <Switch
            id="bot-active"
            checked={reminder.is_active}
            onCheckedChange={(v) => update({ is_active: v })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bot-phone">מספר הוואטסאפ של הנמען</Label>
            <Input
              id="bot-phone"
              dir="ltr"
              value={reminder.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="972509151878"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bot-city">יישוב לחישוב הזמנים</Label>
            <select
              id="bot-city"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={reminder.city}
              onChange={(e) => update({ city: e.target.value })}
            >
              {CITIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={reminder.thursday_enabled}
                onCheckedChange={(v) => update({ thursday_enabled: v })}
              />
              <span className="text-sm font-medium">תזכורת יום חמישי (הכנות לשבת)</span>
            </div>
            <Input
              type="time"
              dir="ltr"
              className="w-32"
              value={reminder.thursday_time}
              onChange={(e) => update({ thursday_time: e.target.value })}
              disabled={!reminder.thursday_enabled}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={reminder.friday_enabled}
                onCheckedChange={(v) => update({ friday_enabled: v })}
              />
              <span className="text-sm font-medium">תזכורת יום שישי בבוקר (זמני שבת)</span>
            </div>
            <Input
              type="time"
              dir="ltr"
              className="w-32"
              value={reminder.friday_time}
              onChange={(e) => update({ friday_time: e.target.value })}
              disabled={!reminder.friday_enabled}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={reminder.before_candles_enabled}
                onCheckedChange={(v) => update({ before_candles_enabled: v })}
              />
              <span className="text-sm font-medium">תזכורת לפני הדלקת נרות</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={5}
                max={180}
                dir="ltr"
                className="w-24"
                value={reminder.minutes_before_candles}
                onChange={(e) => update({ minutes_before_candles: Number(e.target.value) })}
                disabled={!reminder.before_candles_enabled}
              />
              <span className="text-sm text-muted-foreground">דקות לפני</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            שמור הגדרות
          </Button>
          <Button variant="outline" onClick={sendTest} disabled={testing}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            שלח תזכורת בדיקה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppBotReminders;
