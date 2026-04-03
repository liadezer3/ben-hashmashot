import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flame, Check, Calendar, TrendingUp } from "lucide-react";
import { format, previousFriday, isFriday, isToday, startOfDay } from "date-fns";
import { he } from "date-fns/locale";

interface CandleLightingTrackerProps {
  userId: string;
}

function getThisShabbatDate(): string {
  const now = new Date();
  const friday = isFriday(now) ? now : previousFriday(now);
  // If it's after Friday, use today's context; otherwise, find the closest Friday
  const today = new Date();
  const day = today.getDay();
  let targetFriday: Date;
  if (day === 5) {
    targetFriday = today;
  } else if (day === 6) {
    // Saturday - use yesterday (Friday)
    targetFriday = new Date(today);
    targetFriday.setDate(today.getDate() - 1);
  } else {
    // Find next Friday
    targetFriday = new Date(today);
    targetFriday.setDate(today.getDate() + (5 - day));
  }
  return format(targetFriday, "yyyy-MM-dd");
}

interface LogEntry {
  id: string;
  shabbat_date: string;
  blessing_said: boolean;
  notes: string | null;
  created_at: string;
}

export default function CandleLightingTracker({ userId }: CandleLightingTrackerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [blessingSaid, setBlessingSaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const thisShabbat = getThisShabbatDate();
  const todayLogged = logs.some(l => l.shabbat_date === thisShabbat);

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    const { data } = await supabase
      .from("candle_lighting_log")
      .select("*")
      .eq("user_id", userId)
      .order("shabbat_date", { ascending: false })
      .limit(52);
    setLogs((data as LogEntry[]) || []);
    setLoading(false);
  };

  const logLighting = async () => {
    const { error } = await supabase.from("candle_lighting_log").insert({
      user_id: userId,
      shabbat_date: thisShabbat,
      blessing_said: blessingSaid,
      notes: notes || null,
    });
    if (error) {
      if (error.code === "23505") toast.info("כבר רשמת הדלקה לשבת זו!");
      else toast.error("שגיאה בשמירה");
      return;
    }
    toast.success("הדלקת נרות נרשמה! 🕯️");
    setNotes("");
    setShowForm(false);
    loadLogs();
  };

  // Calculate streak
  const streak = (() => {
    let s = 0;
    const sorted = [...logs].sort((a, b) => b.shabbat_date.localeCompare(a.shabbat_date));
    // Check consecutive Fridays
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { s = 1; continue; }
      const prev = new Date(sorted[i - 1].shabbat_date);
      const curr = new Date(sorted[i].shabbat_date);
      const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 7) s++;
      else break;
    }
    return s;
  })();

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-5 h-5 text-amber-500" />
          מעקב הדלקת נרות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              שבת {format(new Date(thisShabbat), "d בMMMM", { locale: he })}
            </p>
            <p className="text-xs text-muted-foreground">
              {todayLogged ? "הדלקת נרות נרשמה ✓" : "טרם נרשמה הדלקה"}
            </p>
          </div>
          {streak > 1 && (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
              <TrendingUp className="w-3 h-3" />
              {streak} שבתות ברצף
            </Badge>
          )}
        </div>

        {!todayLogged && !showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full gap-2">
            <Flame className="w-4 h-4" />
            רשום הדלקת נרות
          </Button>
        )}

        {showForm && !todayLogged && (
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between">
              <Label htmlFor="blessing">נאמרה ברכה</Label>
              <Switch
                id="blessing"
                checked={blessingSaid}
                onCheckedChange={setBlessingSaid}
              />
            </div>
            <Textarea
              placeholder="הערות (אופציונלי)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={logLighting} className="flex-1 gap-2">
                <Check className="w-4 h-4" />
                שמור
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                ביטול
              </Button>
            </div>
          </div>
        )}

        {todayLogged && (
          <div className="text-center py-2">
            <span className="text-3xl">🕯️🕯️</span>
            <p className="text-sm text-muted-foreground mt-1">שבת שלום!</p>
          </div>
        )}

        {/* Recent history */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              היסטוריה אחרונה
            </h4>
            <div className="grid grid-cols-8 gap-1">
              {logs.slice(0, 16).map((log) => (
                <div
                  key={log.id}
                  className="aspect-square rounded-sm bg-amber-500/20 border border-amber-300/30 flex items-center justify-center text-xs"
                  title={format(new Date(log.shabbat_date), "d/M/yy")}
                >
                  🕯️
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              סה״כ {logs.length} הדלקות נרשמו
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
