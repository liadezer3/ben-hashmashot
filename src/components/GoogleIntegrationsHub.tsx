import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Calendar,
  HardDrive,
  MapPin,
  Sheet,
  FileText,
  Presentation,
  Sparkles,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SynagoguesFinder } from "@/components/dashboard/SynagoguesFinder";

type ServiceKey =
  | "gmail"
  | "calendar"
  | "drive"
  | "maps"
  | "sheets"
  | "docs"
  | "slides"
  | "gemini";

interface ServiceDef {
  key: ServiceKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  desc: string;
}

const SERVICES: ServiceDef[] = [
  { key: "gmail", label: "Gmail", icon: Mail, color: "text-[#EA4335]", desc: "שליחת הזמנה למשפחה" },
  { key: "calendar", label: "Calendar", icon: Calendar, color: "text-[#4285F4]", desc: "הוספת זמני שבת ליומן" },
  { key: "drive", label: "Drive", icon: HardDrive, color: "text-[#0F9D58]", desc: "הקבצים שלי" },
  { key: "maps", label: "Maps", icon: MapPin, color: "text-[#34A853]", desc: "בתי כנסת קרובים" },
  { key: "sheets", label: "Sheets", icon: Sheet, color: "text-[#0F9D58]", desc: "ייצוא רשימת קניות" },
  { key: "docs", label: "Docs", icon: FileText, color: "text-[#4285F4]", desc: "חוברת פרשת השבוע" },
  { key: "slides", label: "Slides", icon: Presentation, color: "text-[#F4B400]", desc: "מצגת דבר תורה" },
  { key: "gemini", label: "Gemini", icon: Sparkles, color: "text-[#8E44AD]", desc: "שאלות תורניות חכמות" },
];

async function callGoogle(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("google-services", {
    body: { action, payload },
  });
  if (error) {
    const edgeError = error as { context?: { json?: () => Promise<{ error?: string }> } };
    const body = await edgeError?.context?.json?.().catch(() => null);
    throw new Error(body?.error || error.message);
  }
  return data;
}

export const GoogleIntegrationsHub = () => {
  const [active, setActive] = useState<ServiceKey | null>(null);
  const [loading, setLoading] = useState(false);

  // form state
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("הזמנה לסעודת שבת");
  const [body, setBody] = useState("");
  const [eventTitle, setEventTitle] = useState("הדלקת נרות שבת");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("18:00");
  const [shoppingItems, setShoppingItems] = useState("חלות\nיין לקידוש\nנרות שבת\nדגים");
  const [docTopic, setDocTopic] = useState("");
  const [slidesTopic, setSlidesTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [files, setFiles] = useState<{ id: string; name: string; webViewLink?: string }[]>([]);

  const openLink = (url?: string) => url && window.open(url, "_blank");

  const close = () => {
    setActive(null);
    setAnswer("");
    setFiles([]);
  };

  const submit = async () => {
    if (!active) return;
    setLoading(true);
    try {
      if (active === "gmail") {
        await callGoogle("gmail_send", { to, subject, body });
        toast.success("המייל נשלח בהצלחה ✉️");
        close();
      } else if (active === "calendar") {
        if (!eventDate) throw new Error("נא לבחור תאריך");
        const start = new Date(`${eventDate}T${eventTime}:00`);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const data = await callGoogle("calendar_create_event", {
          summary: eventTitle,
          description: "נוצר מאפליקציית בין השמשות",
          startISO: start.toISOString(),
          endISO: end.toISOString(),
        });
        toast.success("האירוע נוסף ליומן 📅", {
          action: { label: "פתח", onClick: () => openLink(data?.htmlLink) },
        });
        close();
      } else if (active === "drive") {
        const data = await callGoogle("drive_list", {});
        setFiles(data?.files || []);
      } else if (active === "sheets") {
        const rows = [["פריט"], ...shoppingItems.split("\n").filter(Boolean).map((i) => [i.trim()])];
        const data = await callGoogle("sheets_export", { title: "רשימת קניות לשבת", rows });
        toast.success("הגיליון נוצר 📊", {
          action: { label: "פתח", onClick: () => openLink(data?.url) },
        });
        close();
      } else if (active === "docs") {
        if (!docTopic) throw new Error("נא להזין נושא");
        const data = await callGoogle("docs_create", {
          title: `חוברת פרשת ${docTopic}`,
          text: `חוברת פרשת ${docTopic}\n\nנכתב מתוך אפליקציית בין השמשות.\n`,
        });
        toast.success("המסמך נוצר 📄", {
          action: { label: "פתח", onClick: () => openLink(data?.url) },
        });
        close();
      } else if (active === "slides") {
        if (!slidesTopic) throw new Error("נא להזין נושא");
        const data = await callGoogle("slides_create", {
          title: `דבר תורה — ${slidesTopic}`,
          slides: [
            { title: `דבר תורה לשבת`, body: slidesTopic },
            { title: "מסר", body: "נקודה למחשבה לסעודת שבת" },
          ],
        });
        toast.success("המצגת נוצרה 🖼️", {
          action: { label: "פתח", onClick: () => openLink(data?.url) },
        });
        close();
      } else if (active === "gemini") {
        if (!question) throw new Error("נא להזין שאלה");
        const data = await callGoogle("gemini_ask", { question });
        setAnswer(data?.answer || "");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          שירותי Google
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          חיבור ישיר ל-Gmail, Calendar, Drive, Maps, Sheets, Docs, Slides ו-Gemini
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:bg-accent"
              >
                <Icon className={`h-7 w-7 ${s.color}`} />
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-[10px] leading-tight text-muted-foreground">{s.desc}</span>
              </button>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={active !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md">
          {active === "gmail" && (
            <>
              <DialogHeader>
                <DialogTitle>שליחת הזמנה ב-Gmail</DialogTitle>
                <DialogDescription>המייל יישלח מחשבון ה-Gmail המחובר</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>נמען</Label><Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@example.com" /></div>
                <div><Label>נושא</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                <div><Label>תוכן</Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="מוזמנים לסעודת שבת אצלנו..." /></div>
              </div>
            </>
          )}

          {active === "calendar" && (
            <>
              <DialogHeader>
                <DialogTitle>הוספת אירוע ל-Google Calendar</DialogTitle>
                <DialogDescription>האירוע יתווסף ליומן המחובר</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>כותרת</Label><Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><Label>תאריך</Label><Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div>
                  <div className="flex-1"><Label>שעה</Label><Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} /></div>
                </div>
              </div>
            </>
          )}

          {active === "drive" && (
            <>
              <DialogHeader>
                <DialogTitle>Google Drive</DialogTitle>
                <DialogDescription>הקבצים האחרונים בחשבון המחובר</DialogDescription>
              </DialogHeader>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {files.length === 0 && <p className="text-sm text-muted-foreground">לחץ "טען קבצים" כדי לראות את הקבצים שלך.</p>}
                {files.map((f) => (
                  <button key={f.id} onClick={() => openLink(f.webViewLink)} className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted p-2 text-right text-sm hover:bg-accent">
                    <span className="truncate">{f.name}</span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          )}

          {active === "maps" && (
            <>
              <DialogHeader>
                <DialogTitle>Google Maps — בתי כנסת קרובים</DialogTitle>
              </DialogHeader>
              <SynagoguesFinder />
            </>
          )}

          {active === "sheets" && (
            <>
              <DialogHeader>
                <DialogTitle>ייצוא רשימת קניות ל-Google Sheets</DialogTitle>
                <DialogDescription>פריט בכל שורה</DialogDescription>
              </DialogHeader>
              <Textarea rows={6} value={shoppingItems} onChange={(e) => setShoppingItems(e.target.value)} />
            </>
          )}

          {active === "docs" && (
            <>
              <DialogHeader>
                <DialogTitle>יצירת חוברת פרשת השבוע ב-Google Docs</DialogTitle>
              </DialogHeader>
              <div><Label>שם הפרשה / נושא</Label><Input value={docTopic} onChange={(e) => setDocTopic(e.target.value)} placeholder="לדוגמה: בראשית" /></div>
            </>
          )}

          {active === "slides" && (
            <>
              <DialogHeader>
                <DialogTitle>יצירת מצגת דבר תורה ב-Google Slides</DialogTitle>
              </DialogHeader>
              <div><Label>נושא הדבר תורה</Label><Input value={slidesTopic} onChange={(e) => setSlidesTopic(e.target.value)} placeholder="לדוגמה: מצוות הכנסת אורחים" /></div>
            </>
          )}

          {active === "gemini" && (
            <>
              <DialogHeader>
                <DialogTitle>שאלה תורנית חכמה (Gemini)</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="מה המסר המרכזי של פרשת השבוע?" />
                {answer && <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{answer}</div>}
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={close}>סגור</Button>
            <Button onClick={submit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {active === "drive" ? "טען קבצים" : active === "gemini" ? "שאל" : "בצע"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GoogleIntegrationsHub;
