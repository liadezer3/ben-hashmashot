import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, Clock } from "lucide-react";
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
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);

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

  const handleTestSMS = async () => {
    if (!contactInfo.phone) {
      toast({
        title: "שגיאה",
        description: "יש להזין מספר טלפון לפני שליחת בדיקה",
        variant: "destructive",
      });
      return;
    }

    setTestingSMS(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: { 
          testSMS: true,
          phone: contactInfo.phone 
        }
      });

      if (error) throw error;

      if (data?.smsSent) {
        toast({
          title: "✅ הודעת SMS נשלחה!",
          description: "בדוק את ההודעות שלך",
        });
      } else {
        toast({
          title: "שגיאה",
          description: data?.message || "לא ניתן לשלוח SMS - בדוק הגדרות Twilio",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Test SMS error:', error);
      toast({
        title: "שגיאה בשליחת SMS",
        description: error.message || "אירעה שגיאה בשליחת ה-SMS",
        variant: "destructive",
      });
    } finally {
      setTestingSMS(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!contactInfo.phone) {
      toast({
        title: "שגיאה",
        description: "יש להזין מספר טלפון לפני שליחת בדיקה",
        variant: "destructive",
      });
      return;
    }

    setTestingWhatsApp(true);
    
    try {
      // Try to send via Twilio first
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: { 
          testWhatsApp: true,
          phone: contactInfo.phone 
        }
      });

      if (error) throw error;

      if (data?.whatsappSent) {
        toast({
          title: "✅ הודעת WhatsApp נשלחה!",
          description: "בדוק את ההודעות שלך בוואטסאפ",
        });
      } else {
        // Fallback to Click-to-Chat
        const cleanPhone = contactInfo.phone.replace(/[\s\-\+]/g, '');
        const testMessage = `🕯️ הודעת בדיקה - זמני שבת\n\nהמערכת מוגדרת כראוי!\nתקבלו התראות על זמני שבת וחג.\n\n✅ הגדרות נשמרו בהצלחה`;
        const encodedMessage = encodeURIComponent(testMessage);
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        toast({
          title: "נפתח WhatsApp!",
          description: "לחץ 'שלח' בוואטסאפ כדי לשלוח את ההודעה",
        });
      }
    } catch (error: any) {
      console.error('Test WhatsApp error:', error);
      // Fallback to Click-to-Chat
      const cleanPhone = contactInfo.phone.replace(/[\s\-\+]/g, '');
      const testMessage = `🕯️ הודעת בדיקה - זמני שבת\n\nהמערכת מוגדרת כראוי!`;
      const encodedMessage = encodeURIComponent(testMessage);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "נפתח WhatsApp!",
        description: "לחץ 'שלח' בוואטסאפ כדי לשלוח את ההודעה",
      });
    } finally {
      setTestingWhatsApp(false);
    }
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
              מספר טלפון (בפורמט בינלאומי: +972...)
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="phone"
                type="tel"
                placeholder="+972501234567"
                value={contactInfo.phone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, phone: e.target.value })
                }
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp || !contactInfo.phone}
                title="שלח הודעת WhatsApp בדיקה"
                className="border-[#25D366] hover:bg-[#25D366]/10"
              >
                <img 
                  src={whatsappIcon} 
                  alt="WhatsApp" 
                  className={`w-5 h-5 ${testingWhatsApp ? 'animate-pulse' : ''}`}
                />
              </Button>
            </div>
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
                <div className="flex-1">
                  <Label htmlFor="sms" className="text-foreground cursor-pointer">
                    הודעת SMS
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    קבלת זמני שבת והתראות ב-SMS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestSMS}
                  disabled={testingSMS || !contactInfo.phone}
                  title="שלח SMS בדיקה"
                  className="text-xs"
                >
                  <Smartphone className={`w-4 h-4 ml-1 ${testingSMS ? 'animate-pulse' : ''}`} />
                  בדיקה
                </Button>
                <Switch
                  id="sms"
                  checked={settings.sms}
                  onCheckedChange={() => handleToggle("sms")}
                />
              </div>
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
                <img 
                  src={whatsappIcon} 
                  alt="WhatsApp" 
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <Label htmlFor="whatsapp" className="text-foreground cursor-pointer">
                    הודעת WhatsApp
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    קבלת זמני שבת, פרשה והתראות
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestWhatsApp}
                  disabled={testingWhatsApp || !contactInfo.phone}
                  title="שלח הודעת WhatsApp בדיקה"
                  className="border-[#25D366] hover:bg-[#25D366]/10 text-xs"
                >
                  <img 
                    src={whatsappIcon} 
                    alt="WhatsApp" 
                    className={`w-4 h-4 ml-1 ${testingWhatsApp ? 'animate-pulse' : ''}`}
                  />
                  בדיקה
                </Button>
                <Switch
                  id="whatsapp"
                  checked={settings.whatsapp}
                  onCheckedChange={() => handleToggle("whatsapp")}
                />
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
