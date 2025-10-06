import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, MessageCircle, Smartphone, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const NotificationSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    sms: false,
    email: false,
    whatsapp: false,
    push: true,
  });

  const [contactInfo, setContactInfo] = useState({
    phone: "",
    email: "",
  });

  const [timeSettings, setTimeSettings] = useState({
    morningTime: "08:00",
    hoursBeforeShabbat: 2,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setSettings({
        sms: data.sms_enabled,
        email: data.email_enabled,
        whatsapp: data.whatsapp_enabled,
        push: data.push_enabled,
      });
      setContactInfo({
        phone: data.phone || "",
        email: data.email || "",
      });
      setTimeSettings({
        morningTime: data.morning_time || "08:00",
        hoursBeforeShabbat: data.hours_before_shabbat || 2,
      });
    }
  };

  const handleToggle = (type: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי לשמור הגדרות",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        phone: contactInfo.phone,
        email: contactInfo.email,
        sms_enabled: settings.sms,
        email_enabled: settings.email,
        whatsapp_enabled: settings.whatsapp,
        push_enabled: settings.push,
        morning_time: timeSettings.morningTime,
        hours_before_shabbat: timeSettings.hoursBeforeShabbat,
      }, {
        onConflict: 'user_id'
      });

    setLoading(false);

    if (error) {
      toast({
        title: "שגיאה בשמירת ההגדרות",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "ההגדרות נשמרו בהצלחה",
        description: "תקבלו התראות בהתאם להגדרות שבחרתם",
      });
    }
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
        <Bell className="w-6 h-6 text-primary" />
        הגדרות התראות
      </h2>

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-foreground">
              מספר טלפון
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="05X-XXX-XXXX"
              value={contactInfo.phone}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, phone: e.target.value })
              }
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-foreground">
              כתובת אימייל
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={contactInfo.email}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, email: e.target.value })
              }
              className="mt-2"
            />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-semibold mb-4 text-foreground">
            זמני התראות
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="morningTime" className="text-foreground">
                שעת התראה בוקר
              </Label>
              <Input
                id="morningTime"
                type="time"
                value={timeSettings.morningTime}
                onChange={(e) =>
                  setTimeSettings({ ...timeSettings, morningTime: e.target.value })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="hoursBeforeShabbat" className="text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                שעות לפני כניסת שבת/חג
              </Label>
              <Input
                id="hoursBeforeShabbat"
                type="number"
                min="1"
                max="6"
                value={timeSettings.hoursBeforeShabbat}
                onChange={(e) =>
                  setTimeSettings({ ...timeSettings, hoursBeforeShabbat: parseInt(e.target.value) })
                }
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-semibold mb-4 text-foreground">
            אפשרויות התראות
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <Label htmlFor="sms" className="text-foreground cursor-pointer">
                  הודעת SMS
                </Label>
              </div>
              <Switch
                id="sms"
                checked={settings.sms}
                onCheckedChange={() => handleToggle("sms")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <Label htmlFor="email-toggle" className="text-foreground cursor-pointer">
                  הודעת אימייל
                </Label>
              </div>
              <Switch
                id="email-toggle"
                checked={settings.email}
                onCheckedChange={() => handleToggle("email")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-primary" />
                <Label htmlFor="whatsapp" className="text-foreground cursor-pointer">
                  הודעת WhatsApp
                </Label>
              </div>
              <Switch
                id="whatsapp"
                checked={settings.whatsapp}
                onCheckedChange={() => handleToggle("whatsapp")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <Label htmlFor="push" className="text-foreground cursor-pointer">
                  התראה צפה
                </Label>
              </div>
              <Switch
                id="push"
                checked={settings.push}
                onCheckedChange={() => handleToggle("push")}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            size="lg"
          >
            {loading ? "שומר..." : "שמור הגדרות"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            תקבלו התראות פעמיים: בבוקר בשעה {timeSettings.morningTime} ו-{timeSettings.hoursBeforeShabbat} שעות לפני כניסת שבת/חג
          </p>
        </div>
      </div>
    </Card>
  );
};
