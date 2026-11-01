import { createFileRoute } from "@tanstack/react-router";
import CityShabbatTimes from "@/pages/CityShabbatTimes";
import { findSeoCity } from "@/lib/seoCities";

const SITE = "https://ben-hashmashot.com";

export const Route = createFileRoute("/shabbat-times/$citySlug")({
  head: ({ params }) => {
    const city = findSeoCity(params.citySlug);
    if (!city) return {};
    const title = `זמני שבת ב${city.he} – כניסה, יציאה והתראות | בין השמשות`;
    const description = `בדקו את זמני כניסת ויציאת שבת ב${city.he} המדויקים, קבלו התראות לפני שבת, ואתרו בתי כנסת וקהילות באזור ${city.he} באתר בין השמשות.`;
    const url = `${SITE}/shabbat-times/${city.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CityShabbatTimes,
});
