import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExtrasLayout } from "@/components/ExtrasLayout";
import { CityPicker, cityHe } from "@/components/CityPicker";
import { TriviaBlock } from "@/components/TriviaBlock";
import { useCityZmanim } from "@/hooks/useCityZmanim";

const T = "דף שבת למקרר – זמנים, תפריט וחידון להדפסה | בין השמשות";
const D = "צרו דף שבת אישי להדפסה: זמני כניסה ויציאה לעיר שלכם, זמני תפילות, תפריט הסעודות וחידון לשולחן – מוכן לתלייה על המקרר.";

export const Route = createFileRoute("/shabbat-sheet")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/shabbat-sheet" }],
  }),
  component: ShabbatSheet,
});

const KEY = "ben-hashmashot:sheet";
interface SheetData { family: string; mincha: string; shacharit: string; arvit: string; menu: string; }
const EMPTY: SheetData = { family: "", mincha: "", shacharit: "", arvit: "", menu: "" };

function ShabbatSheet() {
  const { city, setCity, z } = useCityZmanim();
  const [d, setD] = useState<SheetData>(EMPTY);

  useEffect(() => {
    try { setD({ ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || "{}") }); } catch { /* ignore */ }
  }, []);
  const set = (k: keyof SheetData, v: string) => {
    const next = { ...d, [k]: v };
    setD(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <ExtrasLayout title="דף שבת למקרר" subtitle="ממלאים פעם אחת, הפרטים נשמרים, ובכל שבוע לוחצים הדפסה. הזמנים מתעדכנים לבד.">
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5 print:hidden">
        <div className="flex flex-wrap gap-3 items-center">
          <Input className="flex-1 min-w-40" placeholder="שם המשפחה" value={d.family} onChange={(e) => set("family", e.target.value)} />
          <CityPicker value={city} onChange={setCity} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input placeholder="מנחה (ערב שבת)" value={d.mincha} onChange={(e) => set("mincha", e.target.value)} />
          <Input placeholder="שחרית" value={d.shacharit} onChange={(e) => set("shacharit", e.target.value)} />
          <Input placeholder="ערבית (מוצ״ש)" value={d.arvit} onChange={(e) => set("arvit", e.target.value)} />
        </div>
        <Textarea rows={4} placeholder={"תפריט ומי מביא מה, שורה לכל מנה\nלמשל: חלות – סבתא"} value={d.menu} onChange={(e) => set("menu", e.target.value)} />
        <Button onClick={() => window.print()} className="gap-2 justify-self-start">
          <Printer className="h-4 w-4" /> הדפסה
        </Button>
      </section>

      {/* Printable sheet */}
      <article id="shabbat-sheet" className="rounded-2xl border-2 border-primary/30 bg-card p-8 space-y-6 print:border-0 print:p-0">
        <header className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">{z?.shabbatEntryLabel}</p>
          <h2 className="text-3xl font-bold">שבת שלום{d.family ? ` למשפחת ${d.family}` : ""}</h2>
          {z?.parsha && <p className="text-lg text-primary">{z.holiday ?? z.parsha}</p>}
        </header>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-muted p-4">
            <div className="text-sm text-muted-foreground">הדלקת נרות · {cityHe(city)}</div>
            <div className="text-4xl font-bold text-primary">{z?.candleLightingTime ?? "--:--"}</div>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <div className="text-sm text-muted-foreground">צאת השבת</div>
            <div className="text-4xl font-bold">{z?.havdalahTime ?? "--:--"}</div>
          </div>
        </div>
        {(d.mincha || d.shacharit || d.arvit) && (
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><div className="text-muted-foreground">מנחה</div><div className="font-semibold">{d.mincha || "—"}</div></div>
            <div><div className="text-muted-foreground">שחרית</div><div className="font-semibold">{d.shacharit || "—"}</div></div>
            <div><div className="text-muted-foreground">ערבית</div><div className="font-semibold">{d.arvit || "—"}</div></div>
          </div>
        )}
        {d.menu.trim() && (
          <section>
            <h2 className="text-xl font-semibold mb-2">התפריט</h2>
            <ul className="list-disc ps-5 space-y-1">
              {d.menu.split("\n").filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </section>
        )}
        <TriviaBlock printMode />
        <footer className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          נוצר באתר בין השמשות · ben-hashmashot.com
        </footer>
      </article>
    </ExtrasLayout>
  );
}
