import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/sms-shabbat")({
  head: () => ({
    meta: [
      { title: "תזכורת שבת ב-SMS | בין השמשות" },
      { name: "description", content: "קבלו תזכורת אוטומטית לפני כניסת שבת ישירות לטלפון, לפי זמני השבת המדויקים בעיר שלכם." },
      { property: "og:title", content: "תזכורת שבת ב-SMS | בין השמשות" },
      { property: "og:description", content: "קבלו תזכורת אוטומטית לפני כניסת שבת ישירות לטלפון, לפי זמני השבת המדויקים בעיר שלכם." },
      { property: "og:url", content: "https://ben-hashmashot.com/sms-shabbat" },
      { name: "twitter:title", content: "תזכורת שבת ב-SMS | בין השמשות" },
      { name: "twitter:description", content: "קבלו תזכורת אוטומטית לפני כניסת שבת ישירות לטלפון, לפי זמני השבת המדויקים בעיר שלכם." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/sms-shabbat" }],
  }),
  component: Landing,
});
