import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "בין השמשות – זמני שבת, התראות וקהילה" },
      { name: "description", content: "זמני כניסת ויציאת שבת מדויקים לפי עיר, תזכורות בוואטסאפ, טלגרם, מייל ופוש, ותיעוד רגעי השבת של המשפחה." },
      { property: "og:title", content: "בין השמשות – זמני שבת, התראות וקהילה" },
      { property: "og:description", content: "זמני כניסת ויציאת שבת מדויקים לפי עיר, תזכורות בוואטסאפ, טלגרם, מייל ופוש, ותיעוד רגעי השבת של המשפחה." },
      { property: "og:url", content: "https://ben-hashmashot.com/landing" },
      { name: "twitter:title", content: "בין השמשות – זמני שבת, התראות וקהילה" },
      { name: "twitter:description", content: "זמני כניסת ויציאת שבת מדויקים לפי עיר, תזכורות בוואטסאפ, טלגרם, מייל ופוש, ותיעוד רגעי השבת של המשפחה." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/landing" }],
  }),
  component: Landing,
});
