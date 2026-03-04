import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Star, Users, BookOpen, TrendingUp } from "lucide-react";
import { ShabbatRatingChart } from "@/components/ShabbatRatingChart";

interface AnnualStatsProps {
  userId: string;
}

interface Rating {
  id: string;
  rating: number;
  notes: string | null;
  shabbat_date: string;
  parsha: string | null;
}

interface Memory {
  id: string;
  type: string;
  parsha: string | null;
  tags: string[] | null;
}

export const AnnualStats = ({ userId }: AnnualStatsProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const yearAgoStr = yearAgo.toISOString().split("T")[0];

      const [ratingsRes, memoriesRes] = await Promise.all([
        supabase
          .from("shabbat_ratings")
          .select("id, rating, notes, shabbat_date, parsha")
          .eq("user_id", userId)
          .gte("shabbat_date", yearAgoStr)
          .order("shabbat_date", { ascending: false }),
        supabase
          .from("family_memories")
          .select("id, type, parsha, tags")
          .eq("user_id", userId)
          .gte("created_at", yearAgo.toISOString()),
      ]);

      if (ratingsRes.data) setRatings(ratingsRes.data);
      if (memoriesRes.data) setMemories(memoriesRes.data);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  const stats = useMemo(() => {
    const avg = ratings.length > 0
      ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
      : "—";
    const excellent = ratings.filter((r) => r.rating >= 4).length;
    const bestParsha = (() => {
      const parshaMap = new Map<string, { sum: number; count: number }>();
      ratings.forEach((r) => {
        if (!r.parsha) return;
        const entry = parshaMap.get(r.parsha) || { sum: 0, count: 0 };
        entry.sum += r.rating;
        entry.count += 1;
        parshaMap.set(r.parsha, entry);
      });
      let best = "";
      let bestAvg = 0;
      parshaMap.forEach((v, k) => {
        const a = v.sum / v.count;
        if (a > bestAvg) { bestAvg = a; best = k; }
      });
      return best || "—";
    })();

    return { avg, total: ratings.length, excellent, bestParsha, memoriesCount: memories.length };
  }, [ratings, memories]);

  if (loading) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground">טוען סטטיסטיקות...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          סיכום שנתי
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox icon="⭐" value={stats.avg} label="ממוצע דירוג" />
          <StatBox icon="📅" value={String(stats.total)} label="שבתות דורגו" />
          <StatBox icon="🏆" value={String(stats.excellent)} label="שבתות מצוינות" />
          <StatBox icon="📸" value={String(stats.memoriesCount)} label="זכרונות נשמרו" />
        </div>

        {stats.bestParsha !== "—" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm">הפרשה עם הדירוג הגבוה ביותר: <strong>{stats.bestParsha}</strong></span>
          </div>
        )}

        {ratings.length >= 2 && <ShabbatRatingChart ratings={ratings} />}
      </CardContent>
    </Card>
  );
};

const StatBox = ({ icon, value, label }: { icon: string; value: string; label: string }) => (
  <div className="p-3 rounded-lg bg-muted text-center">
    <p className="text-lg">{icon}</p>
    <p className="text-2xl font-bold text-primary">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);
