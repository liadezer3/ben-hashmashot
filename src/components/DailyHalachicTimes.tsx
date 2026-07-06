import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Sunrise, Sun, Sunset, Moon, Bell, BellOff } from "lucide-react";
import { getDailyHalachicTimes } from "@/lib/halachicTimes";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "halachic-reminders";

const ICONS: Record<string, typeof Clock> = {
  alotHaShachar: Sunrise,
  misheyakir: Sunrise,
  sunrise: Sun,
  sofZmanShma: Sun,
  sofZmanTfilla: Sun,
  chatzot: Sun,
  minchaGedola: Sunset,
  plagHaMincha: Sunset,
  shkiah: Sunset,
  tzeit: Moon,
};

interface DailyHalachicTimesProps {
  city?: string;
}

export const DailyHalachicTimes = ({ city }: DailyHalachicTimesProps) => {
  const times = useMemo(() => getDailyHalachicTimes(city), [city]);

  const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  const toggleReminder = (key: string) => {
    setReminders((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const today = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          זמני היום — {city || "ירושלים"}
        </h3>
        <span className="text-xs text-muted-foreground">{today}</span>
      </div>

      <div className="grid gap-2">
        {times.map((t) => {
          const Icon = ICONS[t.key] || Clock;
          const on = !!reminders[t.key];
          return (
            <div
              key={t.key}
              className="flex items-center gap-3 p-2 rounded-lg border border-border/60 hover:bg-primary/5 transition-colors"
            >
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground truncate">{t.description}</div>
              </div>
              <span className="font-bold tabular-nums text-base">{t.time}</span>
              <Button
                variant="ghost"
                size="icon"
                className={cn("shrink-0", on ? "text-primary" : "text-muted-foreground")}
                onClick={() => toggleReminder(t.key)}
                aria-label={on ? "בטל תזכורת" : "הפעל תזכורת"}
                title={on ? "בטל תזכורת" : "קבל תזכורת יומית"}
              >
                {on ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 text-center">
        הזמנים מחושבים מקומית לפי מיקומך. לזמנים מדויקים למנהג הקהילה, התייעצו עם רב.
      </p>
    </Card>
  );
};

export default DailyHalachicTimes;
