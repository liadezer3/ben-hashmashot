import { useEffect, useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Moon, BookOpen, Bell } from "lucide-react";
import { getShabbatZmanim } from "@/lib/shabbatZmanim";
import { SEO_CITIES, findSeoCity } from "@/lib/seoCities";

const SITE = "https://ben-hashmashot.com";

const setMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const CityShabbatTimes = () => {
  const { citySlug } = useParams();
  const city = findSeoCity(citySlug);

  const zmanim = useMemo(() => (city ? getShabbatZmanim(city.key) : null), [city]);

  useEffect(() => {
    if (!city) return;
    const title = `זמני שבת ב${city.he} – כניסה, יציאה והתראות | בין השמשות`;
    const desc = `בדקו את זמני כניסת ויציאת שבת ב${city.he} המדויקים, קבלו התראות לפני שבת, ואתרו בתי כנסת וקהילות באזור ${city.he} באתר בין השמשות.`;
    const url = `${SITE}/shabbat-times/${city.slug}`;
    document.title = title;
    setMeta("name", "description", desc);
    setMeta("name", "robots", "index, follow");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [city]);

  if (!city) return <Navigate to="/shabbat-times/jerusalem" replace />;

  const rows = [
    { icon: BookOpen, label: "פרשת השבוע", value: zmanim?.holiday || zmanim?.parsha || "—" },
    { icon: Flame, label: "כניסת שבת (הדלקת נרות)", value: zmanim?.candleLightingTime },
    { icon: Moon, label: "יציאת שבת (הבדלה)", value: zmanim?.havdalahTime },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold">זמני שבת ב{city.he}</h1>
          {zmanim?.shabbatEntryLabel && (
            <p className="text-muted-foreground">{zmanim.shabbatEntryLabel}</p>
          )}
        </header>

        <section aria-label={`זמני שבת ב${city.he}`} className="grid gap-4 sm:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.label} className="p-6 text-center space-y-2">
              <r.icon className="w-7 h-7 mx-auto text-primary" aria-hidden />
              <h2 className="text-sm text-muted-foreground font-medium">{r.label}</h2>
              <p className="text-2xl font-bold">{r.value}</p>
            </Card>
          ))}
        </section>
        <p className="text-xs text-center text-muted-foreground">
          לפי הלוח המקובל בישראל: הדלקת נרות {zmanim?.candleMinutes} דקות לפני השקיעה, צאת השבת לפי צאת הכוכבים.
        </p>

        <section className="space-y-4 text-center">
          <p className="text-lg leading-relaxed text-muted-foreground">
            מחפשים את זמני כניסת ויציאת שבת ב{city.he}? באתר בין השמשות תוכלו להתעדכן בזמני השבת המדויקים ביותר עבור {city.he}, לקבל התראות מותאמות אישית לפני כניסת שבת, ולאתר בתי כנסת ואירועים קהילתיים בסביבתכם.
          </p>
          <Button asChild size="lg" className="rounded-full gap-2">
            <Link to="/landing"><Bell className="w-5 h-5" />קבלו התראה לפני שבת</Link>
          </Button>
        </section>

        <nav aria-label="ערים נוספות" className="border-t border-border pt-8">
          <h2 className="text-xl font-bold text-center mb-4">זמני שבת בערים נוספות</h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {SEO_CITIES.filter((c) => c.slug !== city.slug).map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/shabbat-times/${c.slug}`}
                  className="inline-block px-4 py-2 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors"
                >
                  זמני שבת ב{c.he}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
};

export default CityShabbatTimes;
