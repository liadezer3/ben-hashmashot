import { createFileRoute } from "@tanstack/react-router";
import AIDisclosure from "@/pages/AIDisclosure";

export const Route = createFileRoute("/ai-disclosure")({
  head: () => ({
    meta: [
      { title: "שימוש בבינה מלאכותית | בין השמשות" },
      { name: "description", content: "איך בין השמשות משתמש בבינה מלאכותית לתוכן תורני, מתכונים ותזכורות, ומה חשוב לדעת." },
      { property: "og:title", content: "שימוש בבינה מלאכותית | בין השמשות" },
      { property: "og:description", content: "איך בין השמשות משתמש בבינה מלאכותית לתוכן תורני, מתכונים ותזכורות, ומה חשוב לדעת." },
      { property: "og:url", content: "https://ben-hashmashot.com/ai-disclosure" },
      { name: "twitter:title", content: "שימוש בבינה מלאכותית | בין השמשות" },
      { name: "twitter:description", content: "איך בין השמשות משתמש בבינה מלאכותית לתוכן תורני, מתכונים ותזכורות, ומה חשוב לדעת." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/ai-disclosure" }],
  }),
  component: AIDisclosure,
});
