import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Flame, Check, Star } from "lucide-react";
import { HDate, OmerEvent } from "@hebcal/core";

const OMER_WEEKS = ["חסד", "גבורה", "תפארת", "נצח", "הוד", "יסוד", "מלכות"];

function getOmerDay(): number | null {
  const today = new HDate();
  const nisan15 = new HDate(15, "Nisan", today.getFullYear());
  const diff = today.abs() - nisan15.abs();
  if (diff >= 0 && diff < 49) return diff + 1;
  return null;
}

function getOmerText(day: number): string {
  const weeks = Math.floor((day - 1) / 7);
  const days = ((day - 1) % 7) + 1;
  const weekDay = days === 7 ? 0 : days;
  
  const hebrewDays = ["", "יום אחד", "שני ימים", "שלושה ימים", "ארבעה ימים", "חמישה ימים", "שישה ימים", "שבעה ימים"];
  const hebrewWeeks = ["", "שבוע אחד", "שני שבועות", "שלושה שבועות", "ארבעה שבועות", "חמישה שבועות", "שישה שבועות", "שבעה שבועות"];
  
  if (weeks === 0) return `היום ${hebrewDays[day]} לעומר`;
  if (weekDay === 0) return `היום ${hebrewDays[day > 7 ? 7 : day]} שהם ${hebrewWeeks[weeks]} לעומר`;
  return `היום ${day} יום שהם ${hebrewWeeks[weeks]} ו${hebrewDays[weekDay]} לעומר`;
}

interface OmerCounterProps {
  userId: string;
}

export default function OmerCounter({ userId }: OmerCounterProps) {
  const [counts, setCounts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const currentDay = useMemo(() => getOmerDay(), []);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadCounts();
  }, [userId]);

  const loadCounts = async () => {
    const { data } = await supabase
      .from("omer_counts")
      .select("day_number")
      .eq("user_id", userId)
      .eq("year", currentYear);
    setCounts(data?.map(d => d.day_number) || []);
    setLoading(false);
  };

  const countToday = async () => {
    if (!currentDay) return;
    const { error } = await supabase.from("omer_counts").insert({
      user_id: userId,
      day_number: currentDay,
      year: currentYear,
    });
    if (error) {
      if (error.code === "23505") toast.info("כבר ספרת היום! 🎉");
      else toast.error("שגיאה בשמירה");
      return;
    }
    setCounts(prev => [...prev, currentDay]);
    toast.success(`ספרת יום ${currentDay} לעומר! 🌾`);
  };

  const todayCounted = currentDay ? counts.includes(currentDay) : false;
  const streak = useMemo(() => {
    if (!currentDay) return 0;
    let s = 0;
    for (let d = currentDay; d >= 1; d--) {
      if (counts.includes(d)) s++;
      else break;
    }
    return s;
  }, [counts, currentDay]);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-5 h-5 text-orange-500" />
          ספירת העומר
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentDay ? (
          <>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">{currentDay}</div>
              <p className="text-sm text-muted-foreground">{getOmerText(currentDay)}</p>
              <Badge variant="outline" className="gap-1">
                <Star className="w-3 h-3" />
                {OMER_WEEKS[Math.floor((currentDay - 1) / 7)]}
              </Badge>
            </div>

            <Progress value={(currentDay / 49) * 100} className="h-3" />
            <p className="text-xs text-center text-muted-foreground">
              {currentDay} מתוך 49 ימים ({Math.round((currentDay / 49) * 100)}%)
            </p>

            <Button
              onClick={countToday}
              disabled={todayCounted}
              className="w-full gap-2"
              size="lg"
            >
              {todayCounted ? (
                <>
                  <Check className="w-5 h-5" />
                  ספרת היום ✓
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  ספור היום
                </>
              )}
            </Button>

            {streak > 1 && (
              <div className="text-center">
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">
                  🔥 רצף של {streak} ימים!
                </Badge>
              </div>
            )}

            {/* Mini grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 49 }, (_, i) => i + 1).map(day => (
                <div
                  key={day}
                  className={`w-full aspect-square rounded-sm flex items-center justify-center text-[10px] ${
                    counts.includes(day)
                      ? "bg-primary text-primary-foreground"
                      : day === currentDay
                      ? "bg-primary/20 border border-primary font-bold"
                      : day < (currentDay || 0)
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted/30 text-muted-foreground/50"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            ספירת העומר אינה פעילה כעת 📅
          </p>
        )}
      </CardContent>
    </Card>
  );
}
