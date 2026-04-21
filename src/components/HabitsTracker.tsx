import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star, Check } from "lucide-react";
import { useHabits, HABITS, BADGES } from "@/hooks/useHabits";
import { cn } from "@/lib/utils";

interface HabitsTrackerProps {
  userId: string;
}

export const HabitsTracker = ({ userId }: HabitsTrackerProps) => {
  const { badges, loading, totalPoints, totalLogs, currentStreak, logHabit, isLoggedToday } = useHabits(userId);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  // Next badge to earn (by points)
  const nextPointsBadge = BADGES.filter((b) => b.type === "points" && !badges.includes(b.key)).sort((a, b) => a.threshold - b.threshold)[0];
  const progressToNext = nextPointsBadge ? Math.min(100, (totalPoints / nextPointsBadge.threshold) * 100) : 100;

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-bold">מערכת הרגלים</h3>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Star className="w-5 h-5 mx-auto text-primary mb-1" />
          <div className="text-2xl font-bold text-primary">{totalPoints}</div>
          <div className="text-xs text-muted-foreground">נקודות</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
          <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
          <div className="text-2xl font-bold text-orange-500">{currentStreak}</div>
          <div className="text-xs text-muted-foreground">ימי רצף</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <Trophy className="w-5 h-5 mx-auto text-amber-500 mb-1" />
          <div className="text-2xl font-bold text-amber-500">{badges.length}</div>
          <div className="text-xs text-muted-foreground">מדליות</div>
        </div>
      </div>

      {/* Progress to next badge */}
      {nextPointsBadge && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">המדליה הבאה: {nextPointsBadge.emoji} {nextPointsBadge.labelHe}</span>
            <span className="font-semibold">{totalPoints}/{nextPointsBadge.threshold}</span>
          </div>
          <Progress value={progressToNext} className="h-2" />
        </div>
      )}

      {/* Habits list */}
      <div className="space-y-2 mb-6">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">תיעוד היום</h4>
        {HABITS.map((h) => {
          const done = isLoggedToday(h.key);
          return (
            <Button
              key={h.key}
              variant={done ? "secondary" : "outline"}
              className={cn("w-full justify-between h-auto py-3", done && "opacity-70")}
              onClick={() => logHabit(h)}
              disabled={done}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{h.emoji}</span>
                <span className="font-medium">{h.labelHe}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">+{h.points}</Badge>
                {done && <Check className="w-4 h-4 text-green-600" />}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Earned badges */}
      {badges.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">מדליות שצברת</h4>
          <div className="flex flex-wrap gap-2">
            {BADGES.filter((b) => badges.includes(b.key)).map((b) => (
              <div
                key={b.key}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-primary/10 border border-primary/30"
                title={b.descHe}
              >
                <span className="text-lg">{b.emoji}</span>
                <span className="text-xs font-medium">{b.labelHe}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
