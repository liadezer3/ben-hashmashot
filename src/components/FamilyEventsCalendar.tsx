import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  CalendarHeart, Plus, Trash2, Gift, Heart, Star, Calendar, BookOpen,
  Sparkles, Send, Copy, Loader2, CalendarPlus, MessageCircle
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { he } from "date-fns/locale";

const EVENT_TYPES = [
  { value: "birthday", label: "🎂 יום הולדת", icon: Gift },
  { value: "anniversary", label: "💍 יום נישואין", icon: Heart },
  { value: "yahrzeit", label: "🕯️ יום זיכרון/יארצייט", icon: BookOpen },
  { value: "bar_mitzvah", label: "✡️ בר/בת מצווה", icon: Star },
  { value: "general", label: "📅 אירוע כללי", icon: Calendar },
];

const DATE_PREFERENCES = [
  { value: "gregorian", label: "לועזי בלבד", description: "לפי הלוח הלועזי" },
  { value: "hebrew", label: "עברי בלבד", description: "לפי הלוח העברי" },
  { value: "both", label: "גם וגם", description: "תזכורת בשני התאריכים" },
];

const REMINDER_OPTIONS = [
  { value: "0", label: "ביום עצמו" },
  { value: "1", label: "יום לפני" },
  { value: "3", label: "3 ימים לפני" },
  { value: "7", label: "שבוע לפני" },
];

interface FamilyEvent {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  hebrew_date: string | null;
  is_recurring: boolean;
  notes: string | null;
  group_id: string | null;
  date_preference?: string;
  reminder_days?: number;
}

interface FamilyEventsCalendarProps {
  userId: string;
}

export default function FamilyEventsCalendar({ userId }: FamilyEventsCalendarProps) {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("birthday");
  const [eventDate, setEventDate] = useState("");
  const [hebrewDate, setHebrewDate] = useState("");
  const [datePreference, setDatePreference] = useState("gregorian");
  const [isRecurring, setIsRecurring] = useState(true);
  const [reminderDays, setReminderDays] = useState("1");
  const [notes, setNotes] = useState("");
  
  // Blessing generator state
  const [showBlessingDialog, setShowBlessingDialog] = useState(false);
  const [selectedEventForBlessing, setSelectedEventForBlessing] = useState<FamilyEvent | null>(null);
  const [blessingText, setBlessingText] = useState("");
  const [customBlessing, setCustomBlessing] = useState("");
  const [generatingBlessing, setGeneratingBlessing] = useState(false);
  const [blessingStyle, setBlessingStyle] = useState("warm");

  // Hebrew date conversion
  const [convertingDate, setConvertingDate] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [userId]);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("family_events")
      .select("*")
      .order("event_date", { ascending: true });
    setEvents((data as FamilyEvent[]) || []);
    setLoading(false);
  };

  // Convert Gregorian date to Hebrew using Hebcal API
  const convertToHebrewDate = async (gregDate: string) => {
    if (!gregDate) return;
    setConvertingDate(true);
    try {
      const [year, month, day] = gregDate.split("-");
      const response = await fetch(
        `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`
      );
      const data = await response.json();
      if (data.hebrew) {
        setHebrewDate(data.hebrew);
        toast.success(`תאריך עברי: ${data.hebrew}`);
      }
    } catch (error) {
      console.error("Error converting date:", error);
      toast.error("שגיאה בהמרת התאריך");
    } finally {
      setConvertingDate(false);
    }
  };

  const addEvent = async () => {
    if (!title || !eventDate) {
      toast.error("נא למלא כותרת ותאריך");
      return;
    }
    const { error } = await supabase.from("family_events").insert({
      user_id: userId,
      title,
      event_type: eventType,
      event_date: eventDate,
      hebrew_date: hebrewDate || null,
      is_recurring: isRecurring,
      notes: notes || null,
      recurrence_type: datePreference,
    });
    if (error) {
      toast.error("שגיאה בשמירה");
      return;
    }
    toast.success("האירוע נוסף! 🎉");
    resetForm();
    loadEvents();
  };

  const resetForm = () => {
    setTitle("");
    setEventDate("");
    setHebrewDate("");
    setDatePreference("gregorian");
    setNotes("");
    setShowForm(false);
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("family_events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("האירוע נמחק");
  };

  // Generate blessing with AI
  const generateBlessing = async () => {
    if (!selectedEventForBlessing) return;
    setGeneratingBlessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-blessing", {
        body: {
          eventType: selectedEventForBlessing.event_type,
          personName: selectedEventForBlessing.title.replace(/יום הולדת (של )?/i, "").replace(/יום נישואין (של )?/i, ""),
          style: blessingStyle,
          hebrewDate: selectedEventForBlessing.hebrew_date,
        },
      });

      if (error) throw error;
      setBlessingText(data.blessing || "לא הצלחנו ליצור ברכה, נסה שוב");
    } catch (error) {
      console.error("Error generating blessing:", error);
      // Fallback to local blessing templates
      const templates = {
        birthday: {
          warm: `מזל טוב ליום ההולדת! 🎂\nשתהיה שנה מלאה בבריאות, אושר והצלחה.\nאוהבים אותך! ❤️`,
          formal: `ברכות חמות ליום הולדתך!\nמאחלים לך שנה של בריאות איתנה, הצלחה בכל מעשי ידיך, ושמחה בלב.\nבברכה`,
          funny: `יום הולדת שמח! 🎈\nעוד שנה חלפה ואתה עדיין נראה... בערך אותו דבר 😄\nשיהיה מדהים!`,
          religious: `מזל טוב ליום ההולדת! 🎂\nיהי רצון שהקב"ה ימלא כל משאלות לבך לטובה.\nשתזכה לשנים רבות של תורה, חופה ומעשים טובים.`,
        },
        anniversary: {
          warm: `מזל טוב ליום הנישואין! 💍\nשתמשיכו לאהוב ולשמח זה את זה.\nאוהבים אתכם!`,
          formal: `ברכות ליום נישואיכם!\nמאחלים לכם המשך חיים מאושרים יחד, מלאים באהבה וכבוד הדדי.`,
          funny: `עוד שנה ביחד ועדיין לא התגרשתם! 😄\nכל הכבוד! שיהיו עוד הרבה כאלה! 💕`,
          religious: `מזל טוב ליום נישואיכם!\nיהי רצון שתזכו לבנות בית נאמן בישראל, מלא בשלום ואהבה.`,
        },
      };
      const eventTemplates = templates[selectedEventForBlessing.event_type as keyof typeof templates] || templates.birthday;
      setBlessingText(eventTemplates[blessingStyle as keyof typeof eventTemplates] || eventTemplates.warm);
    } finally {
      setGeneratingBlessing(false);
    }
  };

  // Copy blessing to clipboard
  const copyBlessing = () => {
    const textToCopy = customBlessing || blessingText;
    navigator.clipboard.writeText(textToCopy);
    toast.success("הברכה הועתקה!");
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    const textToShare = customBlessing || blessingText;
    const encodedText = encodeURIComponent(textToShare);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  };

  // Add to Google Calendar
  const addToGoogleCalendar = (event: FamilyEvent) => {
    const eventDate = new Date(event.event_date);
    const year = new Date().getFullYear();
    eventDate.setFullYear(year);
    if (eventDate < new Date()) eventDate.setFullYear(year + 1);
    
    const startDate = format(eventDate, "yyyyMMdd");
    const endDate = format(addDays(eventDate, 1), "yyyyMMdd");
    
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `${event.hebrew_date ? `תאריך עברי: ${event.hebrew_date}\n` : ""}${event.notes || ""}`
    );
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&recur=RRULE:FREQ=YEARLY`;
    window.open(calendarUrl, "_blank");
    toast.success("נפתח Google Calendar");
  };

  // Sort events: upcoming first
  const sortedEvents = [...events].sort((a, b) => {
    const today = new Date();
    const aDate = new Date(a.event_date);
    const bDate = new Date(b.event_date);
    if (a.is_recurring) aDate.setFullYear(today.getFullYear());
    if (b.is_recurring) bDate.setFullYear(today.getFullYear());
    if (aDate < today && a.is_recurring) aDate.setFullYear(today.getFullYear() + 1);
    if (bDate < today && b.is_recurring) bDate.setFullYear(today.getFullYear() + 1);
    return aDate.getTime() - bDate.getTime();
  });

  const getUpcomingLabel = (event: FamilyEvent) => {
    const today = new Date();
    const eDate = new Date(event.event_date);
    if (event.is_recurring) eDate.setFullYear(today.getFullYear());
    if (eDate < today && event.is_recurring) eDate.setFullYear(today.getFullYear() + 1);
    const diff = differenceInDays(eDate, today);
    if (diff === 0) return "היום! 🎉";
    if (diff === 1) return "מחר";
    if (diff <= 7) return `בעוד ${diff} ימים`;
    if (diff <= 30) return `בעוד ${Math.ceil(diff / 7)} שבועות`;
    return format(eDate, "d בMMMM", { locale: he });
  };

  const getTypeEmoji = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.label.split(" ")[0] || "📅";
  };

  // Check if event is today or soon (for highlighting)
  const isEventSoon = (event: FamilyEvent) => {
    const today = new Date();
    const eDate = new Date(event.event_date);
    if (event.is_recurring) eDate.setFullYear(today.getFullYear());
    if (eDate < today && event.is_recurring) eDate.setFullYear(today.getFullYear() + 1);
    return differenceInDays(eDate, today) <= 7;
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarHeart className="w-5 h-5 text-pink-500" />
            ימי הולדת ואירועים משפחתיים
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="w-4 h-4" />
            הוסף
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
            <Input
              placeholder="שם (למשל: יום הולדת של אמא)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date preference selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">באיזה תאריך לציין?</Label>
              <RadioGroup value={datePreference} onValueChange={setDatePreference} className="grid grid-cols-3 gap-2">
                {DATE_PREFERENCES.map(pref => (
                  <div key={pref.value} className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value={pref.value} id={pref.value} />
                    <Label htmlFor={pref.value} className="text-sm cursor-pointer">
                      {pref.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Gregorian date */}
            {(datePreference === "gregorian" || datePreference === "both") && (
              <div className="space-y-2">
                <Label className="text-sm">תאריך לועזי</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="flex-1"
                  />
                  {datePreference === "both" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => convertToHebrewDate(eventDate)}
                      disabled={!eventDate || convertingDate}
                    >
                      {convertingDate ? <Loader2 className="w-4 h-4 animate-spin" /> : "המר לעברי"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Hebrew date */}
            {(datePreference === "hebrew" || datePreference === "both") && (
              <div className="space-y-2">
                <Label className="text-sm">תאריך עברי</Label>
                <Input
                  placeholder="למשל: כ״ה באדר"
                  value={hebrewDate}
                  onChange={(e) => setHebrewDate(e.target.value)}
                  dir="rtl"
                />
                {datePreference === "hebrew" && (
                  <p className="text-xs text-muted-foreground">
                    💡 טיפ: אם אינך יודע את התאריך העברי, בחר "גם וגם" והזן תאריך לועזי להמרה
                  </p>
                )}
              </div>
            )}

            {/* Reminder setting */}
            <div className="space-y-2">
              <Label className="text-sm">תזכורת</Label>
              <Select value={reminderDays} onValueChange={setReminderDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="recurring">אירוע חוזר מדי שנה</Label>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            <Textarea
              placeholder="הערות (אופציונלי)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />

            <div className="flex gap-2">
              <Button onClick={addEvent} className="flex-1">שמור</Button>
              <Button variant="outline" onClick={resetForm}>ביטול</Button>
            </div>
          </div>
        )}

        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Gift className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              אין אירועים עדיין
            </p>
            <p className="text-sm text-muted-foreground">
              הוסף ימי הולדת, יום נישואין ועוד כדי לקבל תזכורות! 🎂
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map(event => (
              <div
                key={event.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isEventSoon(event) 
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" 
                    : "hover:bg-muted/30"
                }`}
              >
                <span className="text-2xl">{getTypeEmoji(event.event_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{event.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.event_date), "d/M/yyyy")}
                    </span>
                    {event.hebrew_date && (
                      <span className="text-xs text-muted-foreground">
                        • {event.hebrew_date}
                      </span>
                    )}
                    <Badge 
                      variant={isEventSoon(event) ? "default" : "outline"} 
                      className={`text-xs py-0 ${isEventSoon(event) ? "bg-amber-500" : ""}`}
                    >
                      {getUpcomingLabel(event)}
                    </Badge>
                  </div>
                  {event.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{event.notes}</p>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  {/* Blessing button */}
                  <Dialog open={showBlessingDialog && selectedEventForBlessing?.id === event.id} onOpenChange={(open) => {
                    setShowBlessingDialog(open);
                    if (open) {
                      setSelectedEventForBlessing(event);
                      setBlessingText("");
                      setCustomBlessing("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                        title="צור ברכה"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" dir="rtl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-pink-500" />
                          יצירת ברכה - {event.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Blessing style selection */}
                        <div className="space-y-2">
                          <Label>סגנון הברכה</Label>
                          <Select value={blessingStyle} onValueChange={setBlessingStyle}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="warm">🤗 חם ואישי</SelectItem>
                              <SelectItem value="formal">📜 רשמי</SelectItem>
                              <SelectItem value="funny">😄 הומוריסטי</SelectItem>
                              <SelectItem value="religious">✡️ דתי/מסורתי</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Generate button */}
                        <Button 
                          onClick={generateBlessing} 
                          disabled={generatingBlessing}
                          className="w-full gap-2"
                        >
                          {generatingBlessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              יוצר ברכה...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              צור ברכה עם AI
                            </>
                          )}
                        </Button>

                        {/* Generated blessing */}
                        {blessingText && (
                          <div className="p-3 rounded-lg bg-gradient-to-br from-pink-50 to-amber-50 dark:from-pink-950/30 dark:to-amber-950/30 border">
                            <p className="whitespace-pre-line text-sm">{blessingText}</p>
                          </div>
                        )}

                        {/* Custom blessing input */}
                        <div className="space-y-2">
                          <Label>או כתוב ברכה משלך:</Label>
                          <Textarea
                            placeholder="כתוב כאן את הברכה שלך..."
                            value={customBlessing}
                            onChange={(e) => setCustomBlessing(e.target.value)}
                            rows={4}
                          />
                        </div>

                        {/* Share buttons */}
                        {(blessingText || customBlessing) && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={copyBlessing}
                            >
                              <Copy className="w-4 h-4" />
                              העתק
                            </Button>
                            <Button
                              className="flex-1 gap-2 bg-[#25D366] hover:bg-[#128C7E]"
                              onClick={shareViaWhatsApp}
                            >
                              <MessageCircle className="w-4 h-4" />
                              שלח בוואטסאפ
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Add to calendar button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => addToGoogleCalendar(event)}
                    title="הוסף ל-Google Calendar"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </Button>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteEvent(event.id)}
                    title="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
