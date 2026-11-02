import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/whatsapp-shabbat")({
  head: () => ({
    meta: [
      { title: "זמני שבת בוואטסאפ | בין השמשות" },
      { name: "description", content: "קבלו את זמני כניסת ויציאת שבת ותזכורת להדלקת נרות ישירות בוואטסאפ, בחינם ולפי המיקום שלכם." },
      { property: "og:title", content: "זמני שבת בוואטסאפ | בין השמשות" },
      { property: "og:description", content: "קבלו את זמני כניסת ויציאת שבת ותזכורת להדלקת נרות ישירות בוואטסאפ, בחינם ולפי המיקום שלכם." },
      { property: "og:url", content: "https://ben-hashmashot.com/whatsapp-shabbat" },
      { name: "twitter:title", content: "זמני שבת בוואטסאפ | בין השמשות" },
      { name: "twitter:description", content: "קבלו את זמני כניסת ויציאת שבת ותזכורת להדלקת נרות ישירות בוואטסאפ, בחינם ולפי המיקום שלכם." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/whatsapp-shabbat" }],
  }),
  component: Landing,
});
