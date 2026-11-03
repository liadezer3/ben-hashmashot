import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ExtrasLayout } from "@/components/ExtrasLayout";
import { CityPicker } from "@/components/CityPicker";
import { useCityZmanim } from "@/hooks/useCityZmanim";
import { DEFAULT_TIMELINE, subtractMinutes } from "@/lib/shabbatExtras";
import { cn } from "@/lib/utils";

const T = "ציר זמן ליום שישי – הכנה לשבת בלי לחץ | בין השמשות";
const D = "תוכנית יום שישי שמחושבת לאחור משעת הדלקת הנרות בעיר שלך: בישולים, נסיעות, מקלחות ומנוחה – עם סימון משימות.";

export const Route = createFileRoute("/friday-timeline")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/friday-timeline" }],
  }),
  component: FridayTimeline,
});

const DONE_KEY = "ben-hashmashot:timeline-done";

function FridayTimeline() {
  const { city, setCity, z } = useCityZmanim();
  const [done, setDone] = useState<string[]>([]);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")); } catch { /* ignore */ }
    const tick = () => { const d = new Date(); setNow(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`); };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    localStorage.setItem(DONE_KEY, JSON.stringify(next));
  };

  const candle = z?.candleLightingTime ?? "--:--";

  return (
    <ExtrasLayout title="ציר זמן ליום שישי" subtitle="התוכנית מחושבת לאחור משעת הדלקת הנרות. סמנו כל שלב שסיימתם.">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-5 shadow-sm border border-border">
        <div>
          <div className="text-sm text-muted-foreground">הדלקת נרות</div>
          <div className="text-3xl font-bold text-primary">{candle}</div>
        </div>
        <CityPicker value={city} onChange={setCity} />
      </div>

      <ol className="relative border-s-2 border-border ms-3 space-y-5">
        {DEFAULT_TIMELINE.map((s) => {
          const at = subtractMinutes(candle, s.minutesBefore);
          const isDone = done.includes(s.id);
          const isPast = now && at !== "--:--" && now >= at;
          return (
            <li key={s.id} className="ms-6">
              <button
                onClick={() => toggle(s.id)}
                aria-label={`סימון ${s.title}`}
                className={cn(
                  "absolute -start-[13px] flex h-6 w-6 items-center justify-center rounded-full border-2",
                  isDone ? "bg-primary border-primary text-primary-foreground" : "bg-background border-primary/50",
                )}
              >
                {isDone && <Check className="h-3.5 w-3.5" />}
              </button>
              <div className={cn("rounded-xl p-4 transition-opacity", isDone && "opacity-50", isPast && !isDone && "bg-accent/40")}>
                <div className="text-sm font-mono text-primary">{at}</div>
                <div className={cn("font-semibold", isDone && "line-through")}>{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.hint}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <button onClick={() => { setDone([]); localStorage.removeItem(DONE_KEY); }} className="text-sm text-muted-foreground underline">
        איפוס הסימונים
      </button>
    </ExtrasLayout>
  );
}
