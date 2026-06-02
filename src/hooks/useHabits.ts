import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface HabitDefinition {
  key: string;
  labelHe: string;
  labelEn: string;
  emoji: string;
  points: number;
  frequency: "daily" | "weekly";
}

export const HABITS: HabitDefinition[] = [
  { key: "candle_lighting", labelHe: "הדלקת נרות", labelEn: "Candle Lighting", emoji: "🕯️", points: 20, frequency: "weekly" },
  { key: "kiddush", labelHe: "קידוש", labelEn: "Kiddush", emoji: "🍷", points: 15, frequency: "weekly" },
  { key: "torah_study", labelHe: "לימוד תורה", labelEn: "Torah Study", emoji: "📖", points: 10, frequency: "daily" },
  { key: "tefilla", labelHe: "תפילה", labelEn: "Prayer", emoji: "🙏", points: 10, frequency: "daily" },
  { key: "tzedaka", labelHe: "צדקה", labelEn: "Charity", emoji: "💝", points: 15, frequency: "weekly" },
  { key: "shabbat_meal", labelHe: "סעודת שבת", labelEn: "Shabbat Meal", emoji: "🍞", points: 15, frequency: "weekly" },
  { key: "havdalah", labelHe: "הבדלה", labelEn: "Havdalah", emoji: "✨", points: 15, frequency: "weekly" },
];

export interface BadgeDefinition {
  key: string;
  labelHe: string;
  labelEn: string;
  emoji: string;
  descHe: string;
  descEn: string;
  threshold: number;
  type: "total_logs" | "streak" | "points";
}

export const BADGES: BadgeDefinition[] = [
  { key: "first_step", labelHe: "צעד ראשון", labelEn: "First Step", emoji: "🌱", descHe: "תיעוד ראשון", descEn: "First log", threshold: 1, type: "total_logs" },
  { key: "ten_mitzvot", labelHe: "10 מצוות", labelEn: "10 Mitzvot", emoji: "⭐", descHe: "10 הרגלים שתועדו", descEn: "10 habits logged", threshold: 10, type: "total_logs" },
  { key: "fifty_mitzvot", labelHe: "50 מצוות", labelEn: "50 Mitzvot", emoji: "🌟", descHe: "50 הרגלים שתועדו", descEn: "50 habits logged", threshold: 50, type: "total_logs" },
  { key: "hundred_points", labelHe: "100 נקודות", labelEn: "100 Points", emoji: "💯", descHe: "צברת 100 נקודות", descEn: "Earned 100 points", threshold: 100, type: "points" },
  { key: "five_hundred_points", labelHe: "500 נקודות", labelEn: "500 Points", emoji: "🏆", descHe: "צברת 500 נקודות", descEn: "Earned 500 points", threshold: 500, type: "points" },
  { key: "week_streak", labelHe: "רצף שבוע", labelEn: "Week Streak", emoji: "🔥", descHe: "7 ימים רצופים", descEn: "7 days in a row", threshold: 7, type: "streak" },
  { key: "month_streak", labelHe: "רצף חודש", labelEn: "Month Streak", emoji: "🚀", descHe: "30 ימים רצופים", descEn: "30 days in a row", threshold: 30, type: "streak" },
];

interface HabitLog {
  id: string;
  habit_key: string;
  log_date: string;
  points: number;
}

export const useHabits = (userId: string | null) => {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    const [logsRes, badgesRes] = await Promise.all([
      supabase.from("habit_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }),
      supabase.from("user_badges").select("badge_key").eq("user_id", userId),
    ]);
    if (logsRes.data) setLogs(logsRes.data as HabitLog[]);
    if (badgesRes.data) setBadges(badgesRes.data.map((b: any) => b.badge_key));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const totalPoints = logs.reduce((sum, l) => sum + (l.points || 0), 0);
  const totalLogs = logs.length;

  // Calculate current streak (consecutive days with at least one log)
  const calculateStreak = (): number => {
    if (logs.length === 0) return 0;
    const dates = Array.from(new Set(logs.map((l) => l.log_date))).sort().reverse();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const expectedStr = expected.toISOString().split("T")[0];
      if (dates[i] === expectedStr) streak++;
      else if (i === 0 && dates[0] !== expectedStr) {
        // allow if yesterday counted (today not yet logged)
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (dates[0] === yesterday.toISOString().split("T")[0]) {
          streak++;
          continue;
        }
        break;
      } else break;
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  const checkAndAwardBadges = async (newTotalLogs: number, newPoints: number, streak: number) => {
    if (!userId) return;
    const earned: string[] = [];
    for (const b of BADGES) {
      if (badges.includes(b.key)) continue;
      let qualifies = false;
      if (b.type === "total_logs" && newTotalLogs >= b.threshold) qualifies = true;
      if (b.type === "points" && newPoints >= b.threshold) qualifies = true;
      if (b.type === "streak" && streak >= b.threshold) qualifies = true;
      if (qualifies) earned.push(b.key);
    }
    if (earned.length > 0) {
      // Badge issuance is validated server-side; client only triggers re-evaluation.
      const { data: awarded, error } = await supabase.rpc("award_qualified_badges");
      if (!error && awarded) {
        const awardedKeys = awarded as string[];
        setBadges((prev) => [...prev, ...awardedKeys.filter((k) => !prev.includes(k))]);
        earned.length = 0;
        earned.push(...awardedKeys);
      }
      if (!error) {
        earned.forEach((key) => {
          const badge = BADGES.find((b) => b.key === key);
          if (badge) {
            toast({
              title: `${badge.emoji} מדליה חדשה!`,
              description: `${badge.labelHe} - ${badge.descHe}`,
            });
          }
        });
      }
    }
  };

  const logHabit = async (habit: HabitDefinition) => {
    if (!userId) return;
    const { error } = await supabase.from("habit_logs").insert({
      user_id: userId,
      habit_key: habit.key,
      log_date: todayStr,
      points: habit.points,
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "כבר תועד היום", description: `${habit.labelHe} כבר תועד היום` });
      } else {
        toast({ title: "שגיאה", description: error.message, variant: "destructive" });
      }
      return;
    }
    toast({ title: `${habit.emoji} +${habit.points} נקודות!`, description: habit.labelHe });
    await fetchData();
    await checkAndAwardBadges(totalLogs + 1, totalPoints + habit.points, currentStreak);
  };

  const isLoggedToday = (habitKey: string) => {
    return logs.some((l) => l.habit_key === habitKey && l.log_date === todayStr);
  };

  return { logs, badges, loading, totalPoints, totalLogs, currentStreak, logHabit, isLoggedToday, refresh: fetchData };
};
