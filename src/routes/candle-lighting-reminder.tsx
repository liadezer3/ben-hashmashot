import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/candle-lighting-reminder")({
  head: () => ({
    meta: [
      { title: "תזכורת להדלקת נרות שבת | בין השמשות" },
      { name: "description", content: "תזכורת חכמה לפני הדלקת נרות שבת וחג, מחושבת לפי הלוח המקובל בישראל לעיר שלכם." },
      { property: "og:title", content: "תזכורת להדלקת נרות שבת | בין השמשות" },
      { property: "og:description", content: "תזכורת חכמה לפני הדלקת נרות שבת וחג, מחושבת לפי הלוח המקובל בישראל לעיר שלכם." },
      { property: "og:url", content: "https://ben-hashmashot.com/candle-lighting-reminder" },
      { name: "twitter:title", content: "תזכורת להדלקת נרות שבת | בין השמשות" },
      { name: "twitter:description", content: "תזכורת חכמה לפני הדלקת נרות שבת וחג, מחושבת לפי הלוח המקובל בישראל לעיר שלכם." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/candle-lighting-reminder" }],
  }),
  component: Landing,
});
