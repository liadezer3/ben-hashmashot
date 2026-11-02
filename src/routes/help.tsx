import { createFileRoute } from "@tanstack/react-router";
import Help from "@/pages/Help";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "עזרה ושאלות נפוצות | בין השמשות" },
      { name: "description", content: "מדריך לשימוש בבין השמשות: הגדרת עיר, תזכורות לפני שבת, חיבור וואטסאפ וטלגרם ועוד." },
      { property: "og:title", content: "עזרה ושאלות נפוצות | בין השמשות" },
      { property: "og:description", content: "מדריך לשימוש בבין השמשות: הגדרת עיר, תזכורות לפני שבת, חיבור וואטסאפ וטלגרם ועוד." },
      { property: "og:url", content: "https://ben-hashmashot.com/help" },
      { name: "twitter:title", content: "עזרה ושאלות נפוצות | בין השמשות" },
      { name: "twitter:description", content: "מדריך לשימוש בבין השמשות: הגדרת עיר, תזכורות לפני שבת, חיבור וואטסאפ וטלגרם ועוד." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/help" }],
  }),
  component: Help,
});
