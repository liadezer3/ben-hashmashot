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
import { toast } from "sonner";
import { CalendarHeart, Plus, Trash2, Gift, Heart, Star, Calendar, BookOpen } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";

const EVENT_TYPES = [
  { value: "birthday", label: "🎂 יום הולדת", icon: Gift },
  { value: "anniversary", label: "💍 יום נישואין", icon: Heart },
  { value: "yahrzeit", label: "🕯️ יום זיכרון/יארצייט", icon: BookOpen },
  { value: "bar_mitzvah", label: "✡️ בר/בת מצווה", icon: Star },
  { value: "general", label: "📅 אירוע כללי", icon: Calendar },
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
  const [isRecurring, setIsRecurring] = useState(true);
  const [notes, setNotes] = useState("");

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
    });
    if (error) {
      toast.error("שגיאה בשמירה");
      return;
    }
    toast.success("האירוע נוסף! 🎉");
    setTitle("");
    setEventDate("");
    setHebrewDate("");
    setNotes("");
    setShowForm(false);
    loadEvents();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("family_events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success("האירוע נמחק");
  };

  // Sort events: upcoming first
  const sortedEvents = [...events].sort((a, b) => {
    const today = new Date();
    const aDate = new Date(a.event_date);
    const bDate = new Date(b.event_date);
    // For recurring, calculate next occurrence this year
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

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarHeart className="w-5 h-5 text-pink-500" />
            לוח אירועים משפחתי
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="w-4 h-4" />
            הוסף
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <Input
              placeholder="שם האירוע (למשל: יום הולדת של דוד)"
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
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <Input
              placeholder="תאריך עברי (אופציונלי)"
              value={hebrewDate}
              onChange={(e) => setHebrewDate(e.target.value)}
            />
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
              <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
            </div>
          </div>
        )}

        {sortedEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            אין אירועים עדיין. הוסף ימי הולדת, יום נישואין ועוד! 🎂
          </p>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
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
                    <Badge variant="outline" className="text-xs py-0">
                      {getUpcomingLabel(event)}
                    </Badge>
                  </div>
                  {event.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{event.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteEvent(event.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
