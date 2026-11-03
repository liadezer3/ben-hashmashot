import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExtrasLayout } from "@/components/ExtrasLayout";
import { WORLD_CITIES, getWorldShabbatTimes, type WorldTimes } from "@/lib/shabbatExtras";

const T = "זמני שבת בחו״ל – ניו יורק, לונדון, פריז ועוד | בין השמשות";
const D = "זמני כניסת ויציאת שבת ל-20 יעדים פופולריים בעולם לפי שעון מקומי, כולל פרשת השבוע בחו״ל. מושלם למטיילים ואנשי עסקים.";

export const Route = createFileRoute("/world-shabbat-times")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/world-shabbat-times" }],
  }),
  component: WorldTimesPage,
});

function WorldTimesPage() {
  const [q, setQ] = useState("");
  const [times, setTimes] = useState<Record<string, WorldTimes>>({});

  useEffect(() => {
    const t: Record<string, WorldTimes> = {};
    for (const c of WORLD_CITIES) t[c.slug] = getWorldShabbatTimes(c);
    setTimes(t);
  }, []);

  const list = useMemo(() => WORLD_CITIES.filter((c) => c.he.includes(q.trim())), [q]);
  const parsha = Object.values(times)[0]?.parsha;

  return (
    <ExtrasLayout
      title="זמני שבת בעולם"
      subtitle={`השעות מוצגות לפי השעון המקומי בכל עיר: הדלקת נרות 18 דקות לפני השקיעה, צאת שבת בצאת הכוכבים.${parsha ? ` פרשת השבוע בחו״ל: ${parsha}.` : ""}`}
    >
      <div className="relative">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש עיר…" aria-label="חיפוש עיר" />
      </div>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {list.map((c) => {
          const t = times[c.slug];
          return (
            <li key={c.slug} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="font-semibold">{c.he}</div>
                <div className="text-xs text-muted-foreground">{t?.dateLabel}</div>
              </div>
              <div className="flex gap-6 text-center">
                <div><div className="text-xs text-muted-foreground">כניסה</div><div className="font-mono font-semibold text-primary">{t?.candle ?? "…"}</div></div>
                <div><div className="text-xs text-muted-foreground">יציאה</div><div className="font-mono font-semibold">{t?.havdalah ?? "…"}</div></div>
              </div>
            </li>
          );
        })}
        {list.length === 0 && <li className="p-4 text-sm text-muted-foreground">לא נמצאה עיר. נסו שם אחר.</li>}
      </ul>
      <p className="text-xs text-muted-foreground">מומלץ לוודא מול בית חב״ד או הקהילה המקומית ביעד.</p>
    </ExtrasLayout>
  );
}
