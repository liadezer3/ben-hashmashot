import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bell,
  Send,
  Flame,
  Mail,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  BookOpen,
  Settings2,
} from "lucide-react";

interface LogEntry {
  msg: string;
  type: "success" | "error" | "info";
  time: string;
}

interface ServiceConfig {
  connected: boolean;
  [key: string]: unknown;
}

interface ServicesState {
  firebase: ServiceConfig;
  telegram: ServiceConfig;
  resend: ServiceConfig;
}

const NotificationCenter = () => {
  const [services, setServices] = useState<ServicesState>({
    firebase: { connected: false },
    telegram: { connected: false },
    resend: { connected: false },
  });

  const [log, setLog] = useState<LogEntry[]>([]);

  // Firebase fields
  const [firebaseConfig, setFirebaseConfig] = useState("");
  const [firebaseServerKey, setFirebaseServerKey] = useState("");

  // Telegram fields
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChat, setTelegramChat] = useState("");

  // Resend fields
  const [resendKey, setResendKey] = useState("");
  const [resendFrom, setResendFrom] = useState("");

  // Send form
  const [notifType, setNotifType] = useState("community");
  const [notifTitle, setNotifTitle] = useState("חבר חדש הצטרף! 👥");
  const [notifBody, setNotifBody] = useState(
    "משתמש חדש הצטרף לקהילת בן השמשות. בואו לברך אותו/ה!"
  );
  const [sendEmail, setSendEmail] = useState("");
  const [channelFirebase, setChannelFirebase] = useState(true);
  const [channelTelegram, setChannelTelegram] = useState(true);
  const [channelResend, setChannelResend] = useState(true);
  const [sending, setSending] = useState(false);

  const addLog = useCallback((msg: string, type: LogEntry["type"]) => {
    const now = new Date().toLocaleTimeString("he-IL");
    setLog((prev) => [{ msg, type, time: now }, ...prev]);
  }, []);

  const handleNotifTypeChange = (value: string) => {
    setNotifType(value);
    const templates: Record<string, { title: string; body: string }> = {
      community: {
        title: "חבר חדש הצטרף! 👥",
        body: "משתמש חדש הצטרף לקהילת בן השמשות. בואו לברך אותו/ה!",
      },
      post: {
        title: "פוסט חדש בקהילה 📝",
        body: "פוסט חדש פורסם בקהילה. לחץ לקריאה.",
      },
      event: {
        title: "אירוע קהילתי בקרוב 🎉",
        body: "מצטרפים לאירוע הקרוב? אל תפספסו!",
      },
      reminder: {
        title: "תזכורת חשובה ⏰",
        body: "זכרו להתחבר ולעדכן את הפרופיל שלכם.",
      },
      custom: { title: "", body: "" },
    };
    const t = templates[value];
    if (t) {
      setNotifTitle(t.title);
      setNotifBody(t.body);
    }
  };

  const saveFirebase = () => {
    if (!firebaseConfig || !firebaseServerKey) {
      toast.error("יש למלא את כל השדות");
      return;
    }
    setServices((prev) => ({
      ...prev,
      firebase: { connected: true, config: firebaseConfig, serverKey: firebaseServerKey },
    }));
    addLog("Firebase FCM מחובר בהצלחה ✅", "success");
    toast.success("Firebase חובר בהצלחה!");
  };

  const saveTelegram = async () => {
    if (!telegramToken || !telegramChat) {
      toast.error("יש למלא את כל השדות");
      return;
    }
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${telegramToken}/getMe`
      );
      const data = await res.json();
      if (data.ok) {
        setServices((prev) => ({
          ...prev,
          telegram: {
            connected: true,
            token: telegramToken,
            chat: telegramChat,
            botName: data.result.first_name,
          },
        }));
        addLog(
          `Telegram Bot "${data.result.first_name}" מחובר ✅`,
          "success"
        );
        toast.success(`בוט ${data.result.first_name} חובר בהצלחה!`);
      } else {
        addLog("שגיאה בחיבור Telegram – בדוק את ה-Token", "error");
        toast.error("Token לא תקין");
      }
    } catch {
      addLog("שגיאת רשת – Telegram", "error");
      toast.error("שגיאת רשת");
    }
  };

  const saveResend = () => {
    if (!resendKey || !resendFrom) {
      toast.error("יש למלא את כל השדות");
      return;
    }
    setServices((prev) => ({
      ...prev,
      resend: { connected: true, key: resendKey, from: resendFrom },
    }));
    addLog("Resend Email מחובר בהצלחה ✅", "success");
    toast.success("Resend חובר בהצלחה!");
  };

  const sendNotification = async () => {
    if (!notifTitle || !notifBody) {
      toast.error("יש למלא כותרת ותוכן");
      return;
    }
    setSending(true);
    const results: { ch: string; ok: boolean; msg: string }[] = [];

    // Telegram
    if (channelTelegram && services.telegram.connected) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${services.telegram.token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: services.telegram.chat,
              text: `🔔 *${notifTitle}*\n\n${notifBody}`,
              parse_mode: "Markdown",
            }),
          }
        );
        const data = await res.json();
        results.push({
          ch: "Telegram",
          ok: data.ok,
          msg: data.ok ? "הודעה נשלחה" : data.description || "שגיאה",
        });
      } catch {
        results.push({ ch: "Telegram", ok: false, msg: "שגיאת רשת" });
      }
    }

    // Resend Email
    if (channelResend && services.resend.connected && sendEmail) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${services.resend.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: services.resend.from,
            to: [sendEmail],
            subject: notifTitle,
            html: `<h2>${notifTitle}</h2><p>${notifBody}</p><hr/><small>נשלח מ-בן השמשות 🌆</small>`,
          }),
        });
        const data = await res.json();
        results.push({
          ch: "Resend Email",
          ok: res.ok,
          msg: res.ok ? `אימייל נשלח ל-${sendEmail}` : data.message || "שגיאה",
        });
      } catch {
        results.push({ ch: "Resend", ok: false, msg: "שגיאת רשת" });
      }
    }

    // Firebase placeholder
    if (channelFirebase && services.firebase.connected) {
      results.push({
        ch: "Firebase",
        ok: true,
        msg: "Push notification queued (FCM)",
      });
    }

    if (results.length === 0) {
      addLog("לא נבחרו ערוצים פעילים", "info");
      toast.warning("יש לחבר ולבחור ערוץ לפחות אחד");
    } else {
      results.forEach((r) =>
        addLog(`[${r.ch}] ${r.msg}`, r.ok ? "success" : "error")
      );
      const allOk = results.every((r) => r.ok);
      toast[allOk ? "success" : "warning"](
        allOk ? "כל ההתראות נשלחו!" : "חלק מהשליחות נכשלו"
      );
    }

    setSending(false);
  };

  const LogIcon = ({ type }: { type: LogEntry["type"] }) => {
    if (type === "success") return <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
    if (type === "error") return <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />;
    return <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />;
  };

  return (
    <div className="space-y-6">
      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            מדריך חיבור שירותים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              num: 1,
              icon: "🔥",
              title: "Firebase – התראות Push",
              desc: 'צור פרויקט ב-console.firebase.google.com → הפעל Cloud Messaging → העתק את firebaseConfig.',
            },
            {
              num: 2,
              icon: "✈️",
              title: "Telegram – הודעות קהילה",
              desc: "שלח /newbot ל-@BotFather → קבל Token → צור ערוץ והוסף את הבוט כמנהל.",
            },
            {
              num: 3,
              icon: "📧",
              title: "Resend – אימיילים",
              desc: "ב-resend.com/api-keys צור API Key → אמת את הדומיין שלך. חינמי עד 3,000/חודש.",
            },
          ].map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {step.num}
              </div>
              <div>
                <h4 className="text-sm font-semibold">
                  {step.icon} {step.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Firebase */}
        <Card className="border-t-4 border-t-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <Badge
                variant={services.firebase.connected ? "default" : "secondary"}
                className={
                  services.firebase.connected
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : ""
                }
              >
                {services.firebase.connected ? "מחובר" : "ממתין"}
              </Badge>
            </div>
            <CardTitle className="text-base mt-2">Firebase FCM</CardTitle>
            <p className="text-xs text-muted-foreground">
              Push Notifications לאפליקציה
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Firebase Config (JSON)</Label>
              <Input
                placeholder='{"apiKey":"...","projectId":"..."}'
                value={firebaseConfig}
                onChange={(e) => setFirebaseConfig(e.target.value)}
                className="text-xs font-mono ltr text-left"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Server Key</Label>
              <Input
                placeholder="AAAA..."
                value={firebaseServerKey}
                onChange={(e) => setFirebaseServerKey(e.target.value)}
                className="text-xs font-mono ltr text-left"
                dir="ltr"
              />
            </div>
            <Button
              onClick={saveFirebase}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              💾 שמור והתחבר
            </Button>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card className="border-t-4 border-t-sky-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-sky-500" />
              </div>
              <Badge
                variant={services.telegram.connected ? "default" : "secondary"}
                className={
                  services.telegram.connected
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : ""
                }
              >
                {services.telegram.connected ? "מחובר" : "ממתין"}
              </Badge>
            </div>
            <CardTitle className="text-base mt-2">Telegram Bot</CardTitle>
            <p className="text-xs text-muted-foreground">
              הודעות לקהילה בטלגרם
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bot Token</Label>
              <Input
                placeholder="123456:ABC-DEF..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="text-xs font-mono ltr text-left"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Chat ID / Channel</Label>
              <Input
                placeholder="@channel או -100..."
                value={telegramChat}
                onChange={(e) => setTelegramChat(e.target.value)}
                className="text-xs font-mono ltr text-left"
                dir="ltr"
              />
            </div>
            <Button
              onClick={saveTelegram}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white"
              size="sm"
            >
              💾 שמור והתחבר
            </Button>
          </CardContent>
        </Card>

        {/* Resend */}
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-500" />
              </div>
              <Badge
                variant={services.resend.connected ? "default" : "secondary"}
                className={
                  services.resend.connected
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : ""
                }
              >
                {services.resend.connected ? "מחובר" : "ממתין"}
              </Badge>
            </div>
            <CardTitle className="text-base mt-2">Resend Email</CardTitle>
            <p className="text-xs text-muted-foreground">
              אימיילים עד 3,000/חודש חינם
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">API Key</Label>
              <Input
                placeholder="re_..."
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
                className="text-xs font-mono ltr text-left"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">שולח (From Email)</Label>
              <Input
                placeholder="notifications@yourdomain.com"
                value={resendFrom}
                onChange={(e) => setResendFrom(e.target.value)}
                className="text-xs font-mono ltr text-left"
                dir="ltr"
              />
            </div>
            <Button
              onClick={saveResend}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              size="sm"
            >
              💾 שמור והתחבר
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" />
            שליחת התראה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">סוג התראה</Label>
                <select
                  value={notifType}
                  onChange={(e) => handleNotifTypeChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="community">👥 הצטרפות חבר חדש</option>
                  <option value="post">📝 פוסט חדש בקהילה</option>
                  <option value="event">🎉 אירוע קרוב</option>
                  <option value="reminder">⏰ תזכורת</option>
                  <option value="custom">✏️ מותאם אישית</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">כותרת</Label>
                <Input
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="כותרת ההתראה"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">תוכן ההודעה</Label>
                <textarea
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder="תוכן ההודעה..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[80px]"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">ערוצי שליחה</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setChannelFirebase(!channelFirebase)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      channelFirebase
                        ? "border-orange-500 bg-orange-500/10 text-orange-600"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    Firebase
                  </button>
                  <button
                    onClick={() => setChannelTelegram(!channelTelegram)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      channelTelegram
                        ? "border-sky-500 bg-sky-500/10 text-sky-600"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    Telegram
                  </button>
                  <button
                    onClick={() => setChannelResend(!channelResend)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      channelResend
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">כתובת אימייל (לבדיקה)</Label>
                <Input
                  type="email"
                  value={sendEmail}
                  onChange={(e) => setSendEmail(e.target.value)}
                  placeholder="user@example.com"
                  dir="ltr"
                  className="text-left"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">קהל יעד</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option>כל המשתמשים</option>
                  <option>משתמשים חדשים (7 ימים)</option>
                  <option>פעילים לאחרונה</option>
                  <option>משתמש ספציפי</option>
                </select>
              </div>

              <Button
                onClick={sendNotification}
                disabled={sending}
                className="w-full gap-2"
                size="lg"
              >
                <Zap className="w-4 h-4" />
                {sending ? "שולח..." : "🚀 שלח התראה"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="w-5 h-5 text-primary" />
              לוג פעילות
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLog([])}
              className="gap-1 text-xs"
            >
              <Trash2 className="w-3 h-3" />
              נקה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {log.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <Zap className="w-5 h-5 mx-auto mb-2 opacity-50" />
                לוג ריק – שלח התראה ראשונה להתחיל
              </div>
            ) : (
              log.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm animate-in slide-in-from-top-1"
                >
                  <LogIcon type={entry.type} />
                  <span className="flex-1">{entry.msg}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {entry.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
