import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Clock, ExternalLink } from "lucide-react";
import gmailIcon from "@/assets/gmail-icon.png";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  sendImmediateNotification, 
  requestNotificationPermission,
  isNativeApp 
} from "@/lib/localNotifications";
import whatsappIcon from "@/assets/whatsapp-icon.png";

// Generate WhatsApp message with Shabbat times
const generateWhatsAppMessage = async (city: string = "Jerusalem"): Promise<string> => {
  try {
    // Fetch current Shabbat times
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=281184&M=on&lg=he`
    );
    
    if (response.ok) {
      const data = await response.json();
      let candleLighting = "";
      let havdalah = "";
      let parasha = "";
      
      for (const item of data.items || []) {
        if (item.category === "candles") {
          const timeMatch = item.title?.match(/(\d{1,2}:\d{2})/);
          candleLighting = timeMatch ? timeMatch[1] : "";
        } else if (item.category === "havdalah") {
          const timeMatch = item.title?.match(/(\d{1,2}:\d{2})/);
          havdalah = timeMatch ? timeMatch[1] : "";
        } else if (item.category === "parashat") {
          parasha = item.hebrew || item.title || "";
        }
      }
      
      return `🕯️ *שבת שלום!* 🕯️

📖 *פרשת ${parasha}*

📅 *זמני שבת ל${city}:*
🕯️ הדלקת נרות: ${candleLighting}
🌙 צאת שבת: ${havdalah}

שבת שלום ומבורך! ✨

📱 בין השמשות: https://ben-hashmashot.lovable.app`;
    }
  } catch (error) {
    console.error('Error fetching Shabbat times for WhatsApp:', error);
  }
  
  return `🕯️ שבת שלום! בדוק את זמני השבת באפליקציה: https://ben-hashmashot.lovable.app`;
};

export const NotificationSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
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
    daysBeforeShabbat: 0,
    shabbatReminderTime: "12:00",
  });

  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [testingScheduled, setTestingScheduled] = useState(false);
  const [userCity, setUserCity] = useState("ירושלים");

  useEffect(() => {
    loadPreferences();
    loadUserCity();
  }, []);

  const loadUserCity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('city')
      .eq('id', user.id)
      .single();
    
    if (data?.city) {
      setUserCity(data.city);
    }
  };

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
        daysBeforeShabbat: (data as any).days_before_shabbat || 0,
        shabbatReminderTime: (data as any).shabbat_reminder_time || "12:00",
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
        email_enabled: settings.email,
        whatsapp_enabled: settings.whatsapp,
        push_enabled: settings.push,
        morning_time: timeSettings.morningTime,
        hours_before_shabbat: timeSettings.hoursBeforeShabbat,
        days_before_shabbat: timeSettings.daysBeforeShabbat,
        shabbat_reminder_time: timeSettings.shabbatReminderTime,
      } as any, {
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

  const handleTestEmail = async () => {
    if (!contactInfo.email) {
      toast({
        title: "שגיאה",
        description: "יש להזין כתובת אימייל לפני שליחת בדיקה",
        variant: "destructive",
      });
      return;
    }

    setTestingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: { 
          testEmail: true,
          email: contactInfo.email 
        }
      });

      if (error) throw error;

      toast({
        title: "מייל בדיקה נשלח!",
        description: `נשלח מייל לכתובת ${contactInfo.email}`,
      });
    } catch (error: any) {
      console.error('Test email error:', error);
      toast({
        title: "שגיאה בשליחת מייל",
        description: error.message || "אירעה שגיאה בשליחת המייל",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleOpenWhatsApp = async () => {
    setTestingWhatsApp(true);
    
    try {
      const message = await generateWhatsAppMessage(userCity);
      const encodedMessage = encodeURIComponent(message);
      
      // If phone number is provided, send to that number
      if (contactInfo.phone) {
        const cleanPhone = contactInfo.phone.replace(/[\s\-\+]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
      } else {
        // Open WhatsApp without a recipient - user can choose
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      }
      
      toast({
        title: "נפתח WhatsApp!",
        description: "לחץ 'שלח' בוואטסאפ כדי לשלוח את ההודעה",
      });
    } catch (error: any) {
      console.error('WhatsApp error:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לפתוח WhatsApp",
        variant: "destructive",
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleShareWhatsApp = async () => {
    const message = await generateWhatsAppMessage(userCity);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    
    toast({
      title: "נפתח WhatsApp!",
      description: "בחר את אנשי הקשר שאליהם תרצה לשלוח",
    });
  };

  const handleTestPushNotification = async () => {
    if (!isNativeApp()) {
      toast({
        title: "התראות מקומיות",
        description: "התראות מקומיות זמינות רק באפליקציה המותקנת",
        variant: "destructive",
      });
      return;
    }

    setTestingPush(true);
    
    try {
      const granted = await requestNotificationPermission();
      
      if (!granted) {
        toast({
          title: "הרשאה נדרשת",
          description: "יש לאפשר התראות כדי לקבל התראות מקומיות",
          variant: "destructive",
        });
        setTestingPush(false);
        return;
      }

      await sendImmediateNotification(
        "🕯️ בדיקת התראה",
        "התראות מקומיות פועלות כראוי! תקבלו התראות על זמני שבת וחג."
      );

      toast({
        title: "התראה נשלחה!",
        description: "בדקו את מגש ההתראות של המכשיר",
      });
    } catch (error: any) {
      console.error('Test push notification error:', error);
      toast({
        title: "שגיאה בשליחת התראה",
        description: error.message || "אירעה שגיאה בשליחת ההתראה",
        variant: "destructive",
      });
    } finally {
      setTestingPush(false);
    }
  };

  const handleTestScheduledReminder = async () => {
    setTestingScheduled(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "שגיאה",
          description: "יש להתחבר כדי לבדוק את התזכורת המתוזמנת",
          variant: "destructive",
        });
        setTestingScheduled(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('scheduled-push', {
        body: { 
          test: true,
          testType: 'scheduled',
          city: userCity
        }
      });

      if (error) throw error;

      const dayNames = ['באותו יום (יום שישי)', 'יום לפני (יום חמישי)', 'יומיים לפני (יום רביעי)', '3 ימים לפני (יום שלישי)'];
      const dayName = dayNames[timeSettings.daysBeforeShabbat] || dayNames[0];

      let description = `הגדרות: ${dayName} בשעה ${timeSettings.shabbatReminderTime}`;
      if (data?.pushSent > 0) description += ` | Web Push נשלח`;
      if (data?.emailSent) description += ` | מייל נשלח`;

      toast({
        title: "תזכורת מתוזמנת נשלחה!",
        description,
      });
    } catch (error: any) {
      console.error('Test scheduled reminder error:', error);
      toast({
        title: "שגיאה בשליחת תזכורת",
        description: error.message || "אירעה שגיאה בשליחת התזכורת המתוזמנת",
        variant: "destructive",
      });
    } finally {
      setTestingScheduled(false);
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
              מספר טלפון לוואטסאפ (בפורמט בינלאומי: 972...)
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="phone"
                type="tel"
                placeholder="972501234567"
                value={contactInfo.phone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, phone: e.target.value })
                }
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenWhatsApp}
                disabled={testingWhatsApp}
                title="שלח הודעת WhatsApp"
                className="border-[#25D366] hover:bg-[#25D366]/10"
              >
                <img 
                  src={whatsappIcon} 
                  alt="WhatsApp" 
                  className={`w-5 h-5 ${testingWhatsApp ? 'animate-pulse' : ''}`}
                />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              💡 חינמי לחלוטין - נפתח WhatsApp עם הודעה מוכנה
            </p>
          </div>

          <div>
            <Label htmlFor="email" className="text-foreground">
              כתובת אימייל
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={contactInfo.email}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, email: e.target.value })
                }
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleTestEmail}
                disabled={testingEmail || !contactInfo.email}
                title="שלח מייל בדיקה"
              >
                <img 
                  src={gmailIcon} 
                  alt="Gmail" 
                  className={`w-5 h-5 ${testingEmail ? 'animate-pulse' : ''}`}
                />
              </Button>
            </div>
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="daysBeforeShabbat" className="text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  ימים לפני כניסת שבת/חג לתזכורת
                </Label>
                <select
                  id="daysBeforeShabbat"
                  value={timeSettings.daysBeforeShabbat}
                  onChange={(e) =>
                    setTimeSettings({ ...timeSettings, daysBeforeShabbat: parseInt(e.target.value) })
                  }
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={0}>באותו יום (יום שישי)</option>
                  <option value={1}>יום לפני (יום חמישי)</option>
                  <option value={2}>יומיים לפני (יום רביעי)</option>
                  <option value={3}>3 ימים לפני (יום שלישי)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  מתי לשלוח תזכורת לפני שבת/חג
                </p>
              </div>

              <div>
                <Label htmlFor="shabbatReminderTime" className="text-foreground">
                  שעת תזכורת לפני שבת/חג
                </Label>
                <Input
                  id="shabbatReminderTime"
                  type="time"
                  value={timeSettings.shabbatReminderTime}
                  onChange={(e) =>
                    setTimeSettings({ ...timeSettings, shabbatReminderTime: e.target.value })
                  }
                  className="mt-2"
                />
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-muted-foreground flex-1">
                    באיזו שעה לשלוח את התזכורת
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestScheduledReminder}
                    disabled={testingScheduled}
                    className="text-xs"
                  >
                    <Bell className={`w-4 h-4 ml-1 ${testingScheduled ? 'animate-pulse' : ''}`} />
                    {testingScheduled ? "שולח..." : "בדוק תזכורת"}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="hoursBeforeShabbat" className="text-foreground">
                  תזכורת נוספת - שעות לפני כניסת שבת
                </Label>
                <Input
                  id="hoursBeforeShabbat"
                  type="number"
                  min="0"
                  max="6"
                  value={timeSettings.hoursBeforeShabbat}
                  onChange={(e) =>
                    setTimeSettings({ ...timeSettings, hoursBeforeShabbat: parseInt(e.target.value) || 0 })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  תזכורת נוספת ביום שישי, X שעות לפני הדלקת נרות (0 = ללא)
                </p>
              </div>
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
                <Mail className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="email-toggle" className="text-foreground cursor-pointer">
                    הודעת אימייל
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    קבלת זמני שבת אוטומטית במייל
                  </p>
                </div>
              </div>
              <Switch
                id="email-toggle"
                checked={settings.email}
                onCheckedChange={() => handleToggle("email")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <img 
                  src={whatsappIcon} 
                  alt="WhatsApp" 
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <Label htmlFor="whatsapp" className="text-foreground cursor-pointer">
                    שיתוף WhatsApp
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    💚 חינמי - פותח הודעה מוכנה לשליחה
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="border-[#25D366] hover:bg-[#25D366]/10 text-xs"
                >
                  <ExternalLink className="w-4 h-4 ml-1" />
                  שתף עכשיו
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="push" className="text-foreground cursor-pointer">
                    התראות מקומיות (מהמכשיר)
                  </Label>
                  {isNativeApp() && (
                    <p className="text-xs text-muted-foreground mt-1">
                      התראות ישירות ממכשיר הנייד
                    </p>
                  )}
                  {!isNativeApp() && (
                    <p className="text-xs text-muted-foreground mt-1">
                      זמין רק באפליקציה המותקנת
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isNativeApp() && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleTestPushNotification}
                    disabled={testingPush}
                    title="בדוק התראה מקומית"
                  >
                    <Bell className={`w-4 h-4 ${testingPush ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
                <Switch
                  id="push"
                  checked={settings.push}
                  onCheckedChange={() => handleToggle("push")}
                  disabled={!isNativeApp()}
                />
              </div>
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
