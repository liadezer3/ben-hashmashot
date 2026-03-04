import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, TrendingUp } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface ShabbatStreakProps {
  userId: string;
}

export const ShabbatStreak = ({ userId }: ShabbatStreakProps) => {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get all rated shabbat dates ordered
      const { data } = await supabase
        .from("shabbat_ratings")
        .select("shabbat_date")
        .eq("user_id", userId)
        .order("shabbat_date", { ascending: false });
      if (data) setDates(data.map((d) => d.shabbat_date));
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const { currentStreak, longestStreak } = useMemo(() => {
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let current = 1;
    let longest = 1;
    let tempStreak = 1;

    // dates are desc, check consecutive weeks (7 days apart)
    for (let i = 1; i < dates.length; i++) {
      const diff = differenceInDays(parseISO(dates[i - 1]), parseISO(dates[i]));
      if (diff >= 6 && diff <= 8) {
        tempStreak++;
        if (i === 1) current = tempStreak; // still part of current streak
      } else {
        if (i <= current) current = tempStreak; // was counting current
        tempStreak = 1;
      }
      longest = Math.max(longest, tempStreak);
    }
    longest = Math.max(longest, tempStreak);

    // Check if current streak is still active (latest date within ~9 days)
    const latestDate = parseISO(dates[0]);
    const daysSinceLast = differenceInDays(new Date(), latestDate);
    if (daysSinceLast > 9) current = 0;

    return { currentStreak: current, longestStreak: longest };
  }, [dates]);

  if (loading) return null;

  const streakEmoji = currentStreak >= 10 ? "🔥🔥🔥" : currentStreak >= 5 ? "🔥🔥" : currentStreak >= 1 ? "🔥" : "💤";
  const motivationText = currentStreak === 0
    ? "דרג את השבת הקרובה כדי להתחיל רצף!"
    : currentStreak >= 10
    ? "מדהים! אתה על גל!"
    : currentStreak >= 5
    ? "כל הכבוד! ממשיכים!"
    : `עוד ${5 - currentStreak} שבתות לרצף של 5!`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          רצף שבתות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{currentStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">רצף נוכחי</p>
            <p className="text-lg mt-1">{streakEmoji}</p>
          </div>
          <div className="w-px h-16 bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <p className="text-4xl font-bold text-secondary">{longestStreak}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">שיא אישי</p>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">{motivationText}</p>
      </CardContent>
    </Card>
  );
};
