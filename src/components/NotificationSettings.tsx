import { useState, useEffect, lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Clock, ExternalLink, MessageSquare, CheckCircle2, XCircle, Loader2, Send, AlertCircle } from "lucide-react";
import gmailIcon from "@/assets/gmail-icon.png";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  sendImmediateNotification, 
  requestNotificationPermission,
  isNativeApp 
} from "@/lib/localNotifications";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { WebPushSettings } from "./WebPushSettings";
import { NextNotificationDisplay } from "./NextNotificationDisplay";

// SMS removed - using Meta WhatsApp Cloud API instead

type TestStatus = 'idle' | 'sending' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  message?: string;
  timestamp?: Date;
}

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
    sms: false,
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
  const [userCity, setUserCity] = useState("ירושלים");
  
  // Test status for each notification method
  const [testResults, setTestResults] = useState<{
    email: TestResult;
    whatsapp: TestResult;
    sms: TestResult;
    push: TestResult;
    scheduled: TestResult;
  }>({
    email: { status: 'idle' },
    whatsapp: { status: 'idle' },
    sms: { status: 'idle' },
    push: { status: 'idle' },
    scheduled: { status: 'idle' },
  });

  // Scheduled test time
  const [scheduledTestTime, setScheduledTestTime] = useState("");

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
        email: data.email_enabled ?? false,
        whatsapp: data.whatsapp_enabled ?? false,
        sms: data.sms_enabled ?? false,
        push: data.push_enabled ?? true,
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
        sms_enabled: settings.sms,
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

  const updateTestResult = (type: keyof typeof testResults, result: TestResult) => {
    setTestResults(prev => ({ ...prev, [type]: result }));
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

    updateTestResult('email', { status: 'sending' });
    
    try {
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: { 
          testEmail: true,
          email: contactInfo.email 
        }
      });

      if (error) throw error;

      updateTestResult('email', { 
        status: 'success', 
        message: `נשלח לכתובת ${contactInfo.email}`,
        timestamp: new Date()
      });

      toast({
        title: "מייל בדיקה נשלח!",
        description: `נשלח מייל לכתובת ${contactInfo.email}`,
      });
    } catch (error: any) {
      console.error('Test email error:', error);
      updateTestResult('email', { 
        status: 'error', 
        message: error.message || "שגיאה בשליחה",
        timestamp: new Date()
      });
      toast({
        title: "שגיאה בשליחת מייל",
        description: error.message || "אירעה שגיאה בשליחת המייל",
        variant: "destructive",
      });
    }
  };

  const handleOpenWhatsApp = async () => {
    updateTestResult('whatsapp', { status: 'sending' });
    
    try {
      const message = await generateWhatsAppMessage(userCity);
      const encodedMessage = encodeURIComponent(message);
      
      if (contactInfo.phone) {
        const cleanPhone = contactInfo.phone.replace(/[\s\-\+]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
      } else {
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      }
      
      updateTestResult('whatsapp', { 
        status: 'success', 
        message: 'WhatsApp נפתח - לחץ שלח',
        timestamp: new Date()
      });

      toast({
        title: "נפתח WhatsApp!",
        description: "לחץ 'שלח' בוואטסאפ כדי לשלוח את ההודעה",
      });
    } catch (error: any) {
      console.error('WhatsApp error:', error);
      updateTestResult('whatsapp', { 
        status: 'error', 
        message: "לא הצלחנו לפתוח WhatsApp",
        timestamp: new Date()
      });
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לפתוח WhatsApp",
        variant: "destructive",
      });
    }
  };

  const handleOpenSMS = async () => {
    updateTestResult('sms', { status: 'sending' });
    
    try {
      const message = await generateSMSMessage(userCity);
      const encodedMessage = encodeURIComponent(message);
      
      // SMS URI scheme - works on mobile devices
      if (contactInfo.phone) {
        const cleanPhone = contactInfo.phone.replace(/[\s\-\+]/g, '');
        window.open(`sms:${cleanPhone}?body=${encodedMessage}`, '_blank');
      } else {
        window.open(`sms:?body=${encodedMessage}`, '_blank');
      }
      
      updateTestResult('sms', { 
        status: 'success', 
        message: 'SMS נפתח - לחץ שלח',
        timestamp: new Date()
      });

      toast({
        title: "נפתח SMS!",
        description: "לחץ 'שלח' כדי לשלוח את ההודעה",
      });
    } catch (error: any) {
      console.error('SMS error:', error);
      updateTestResult('sms', { 
        status: 'error', 
        message: "לא הצלחנו לפתוח SMS",
        timestamp: new Date()
      });
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לפתוח SMS",
        variant: "destructive",
      });
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

    updateTestResult('push', { status: 'sending' });
    
    try {
      const granted = await requestNotificationPermission();
      
      if (!granted) {
        updateTestResult('push', { 
          status: 'error', 
          message: "הרשאה נדרשת",
          timestamp: new Date()
        });
        toast({
          title: "הרשאה נדרשת",
          description: "יש לאפשר התראות כדי לקבל התראות מקומיות",
          variant: "destructive",
        });
        return;
      }

      await sendImmediateNotification(
        "🕯️ בדיקת התראה",
        "התראות מקומיות פועלות כראוי! תקבלו התראות על זמני שבת וחג."
      );

      updateTestResult('push', { 
        status: 'success', 
        message: 'התראה נשלחה למכשיר',
        timestamp: new Date()
      });

      toast({
        title: "התראה נשלחה!",
        description: "בדקו את מגש ההתראות של המכשיר",
      });
    } catch (error: any) {
      console.error('Test push notification error:', error);
      updateTestResult('push', { 
        status: 'error', 
        message: error.message || "שגיאה בשליחה",
        timestamp: new Date()
      });
      toast({
        title: "שגיאה בשליחת התראה",
        description: error.message || "אירעה שגיאה בשליחת ההתראה",
        variant: "destructive",
      });
    }
  };

  const handleTestScheduledReminder = async () => {
    updateTestResult('scheduled', { status: 'sending' });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        updateTestResult('scheduled', { 
          status: 'error', 
          message: "יש להתחבר תחילה",
          timestamp: new Date()
        });
        toast({
          title: "שגיאה",
          description: "יש להתחבר כדי לבדוק את התזכורת המתוזמנת",
          variant: "destructive",
        });
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

      let resultMessage = `${dayName} בשעה ${timeSettings.shabbatReminderTime}`;
      resultMessage += data?.pushSent > 0 ? ` | Push ✓` : ` | Push ✗`;
      resultMessage += data?.emailSent ? ` | Email ✓` : ` | Email ✗`;
      resultMessage += data?.smsSent ? ` | SMS ✓` : ` | SMS ✗`;
      resultMessage += data?.whatsappSent ? ` | WhatsApp ✓` : ` | WhatsApp ✗`;

      updateTestResult('scheduled', { 
        status: 'success', 
        message: resultMessage,
        timestamp: new Date()
      });

      toast({
        title: "תזכורת מתוזמנת נשלחה!",
        description: resultMessage,
      });
    } catch (error: any) {
      console.error('Test scheduled reminder error:', error);
      updateTestResult('scheduled', { 
        status: 'error', 
        message: error.message || "שגיאה בשליחה",
        timestamp: new Date()
      });
      toast({
        title: "שגיאה בשליחת תזכורת",
        description: error.message || "אירעה שגיאה בשליחת התזכורת המתוזמנת",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'sending':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
        <Bell className="w-6 h-6 text-primary" />
        הגדרות התראות
      </h2>

      <div className="space-y-6">
        {/* Test Panel Section */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            בדיקת שיטות התראה
          </h3>
          
          <div className="space-y-3">
            {/* Email Test */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-3">
                <img src={gmailIcon} alt="Email" className="w-5 h-5" />
                <div>
                  <span className="text-sm font-medium">מייל</span>
                  {testResults.email.status !== 'idle' && (
                    <p className="text-xs text-muted-foreground">
                      {testResults.email.message} {testResults.email.timestamp && `(${formatTimestamp(testResults.email.timestamp)})`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.email.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestEmail}
                  disabled={testResults.email.status === 'sending' || !contactInfo.email}
                >
                  {testResults.email.status === 'sending' ? 'שולח...' : 'בדיקה'}
                </Button>
              </div>
            </div>

            {/* WhatsApp Test */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-3">
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                <div>
                  <span className="text-sm font-medium">WhatsApp</span>
                  {testResults.whatsapp.status !== 'idle' && (
                    <p className="text-xs text-muted-foreground">
                      {testResults.whatsapp.message} {testResults.whatsapp.timestamp && `(${formatTimestamp(testResults.whatsapp.timestamp)})`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.whatsapp.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenWhatsApp}
                  disabled={testResults.whatsapp.status === 'sending'}
                  className="border-[#25D366] hover:bg-[#25D366]/10"
                >
                  {testResults.whatsapp.status === 'sending' ? 'פותח...' : 'בדיקה'}
                </Button>
              </div>
            </div>

            {/* SMS Test */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <span className="text-sm font-medium">SMS</span>
                  {testResults.sms.status !== 'idle' && (
                    <p className="text-xs text-muted-foreground">
                      {testResults.sms.message} {testResults.sms.timestamp && `(${formatTimestamp(testResults.sms.timestamp)})`}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">💡 חינמי - נפתח אפליקציית SMS</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.sms.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSMS}
                  disabled={testResults.sms.status === 'sending'}
                  className="border-blue-500 hover:bg-blue-500/10"
                >
                  {testResults.sms.status === 'sending' ? 'פותח...' : 'בדיקה'}
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-foreground">
              מספר טלפון (בפורמט בינלאומי: 972...)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="972501234567"
              value={contactInfo.phone}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, phone: e.target.value })
              }
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              משמש לשליחת WhatsApp ו-SMS
            </p>
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

        {/* Time Settings */}
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
                <p className="text-xs text-muted-foreground mt-1">
                  באיזו שעה לשלוח את התזכורת
                </p>
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

              {/* Next Notification Display - Real-time calculation */}
              <NextNotificationDisplay 
                settings={settings} 
                timeSettings={timeSettings}
              />

              {/* Scheduled Notification Status */}
              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">סיכום תזכורות אוטומטיות</span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>📧 תזכורת מתוזמנת תישלח במייל:</p>
                  <p className="font-medium text-foreground mr-4">
                    {timeSettings.daysBeforeShabbat === 0 ? 'יום שישי' : 
                     timeSettings.daysBeforeShabbat === 1 ? 'יום חמישי' :
                     timeSettings.daysBeforeShabbat === 2 ? 'יום רביעי' : 'יום שלישי'} 
                    {' '}בשעה {timeSettings.shabbatReminderTime}
                  </p>
                  {timeSettings.hoursBeforeShabbat > 0 && (
                    <p className="mt-2">⏰ תזכורת נוספת {timeSettings.hoursBeforeShabbat} שעות לפני הדלקת נרות</p>
                  )}
                  <p className="mt-2">🌅 התראת בוקר בשעה {timeSettings.morningTime}</p>
                </div>
                
                {/* Automation Status Indicator */}
                <div className="mt-3 p-2 rounded bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-green-700 dark:text-green-400">
                    מערכת האוטומציה פעילה - בודקת כל 5 דקות
                  </span>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestScheduledReminder}
                    disabled={testResults.scheduled.status === 'sending' || !contactInfo.email}
                    className="text-xs"
                  >
                    {testResults.scheduled.status === 'sending' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin ml-1" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 ml-1" />
                        שלח בדיקה עכשיו
                      </>
                    )}
                  </Button>
                  {testResults.scheduled.status !== 'idle' && (
                    <span className="flex items-center gap-1 text-xs">
                      {getStatusIcon(testResults.scheduled.status)}
                      {testResults.scheduled.message}
                    </span>
                  )}
                </div>
                {!contactInfo.email && (
                  <p className="text-xs text-destructive mt-2">יש להזין כתובת אימייל כדי לקבל תזכורות</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Options */}
        <div className="border-t border-border pt-6">
          <h3 className="font-semibold mb-4 text-foreground">
            אפשרויות התראות אוטומטיות
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

            {/* WhatsApp Auto Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <img 
                  src={whatsappIcon} 
                  alt="WhatsApp" 
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <Label htmlFor="whatsapp-toggle" className="text-foreground cursor-pointer">
                    התראות WhatsApp אוטומטיות
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    💰 דורש הגדרת Twilio (בתשלום)
                  </p>
                </div>
              </div>
              <Switch
                id="whatsapp-toggle"
                checked={settings.whatsapp}
                onCheckedChange={() => handleToggle("whatsapp")}
              />
            </div>

            {/* SMS Auto Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <Label htmlFor="sms-toggle" className="text-foreground cursor-pointer">
                    התראות SMS אוטומטיות
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    💰 דורש הגדרת Twilio (בתשלום)
                  </p>
                </div>
              </div>
              <Switch
                id="sms-toggle"
                checked={settings.sms}
                onCheckedChange={() => handleToggle("sms")}
              />
            </div>

            {/* Manual WhatsApp Share */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center gap-3">
                <img 
                  src={whatsappIcon} 
                  alt="WhatsApp" 
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <Label htmlFor="whatsapp" className="text-foreground cursor-pointer">
                    שיתוף WhatsApp ידני
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

            {/* Web Push for Browser */}
            <WebPushSettings />

            {/* Local notifications for native app */}
            {isNativeApp() && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <Label htmlFor="push" className="text-foreground cursor-pointer">
                      התראות מקומיות (מהמכשיר)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      התראות ישירות ממכשיר הנייד
                    </p>
                  </div>
                </div>
                <Switch
                  id="push"
                  checked={settings.push}
                  onCheckedChange={() => handleToggle("push")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
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
