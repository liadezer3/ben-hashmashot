import { createFileRoute } from "@tanstack/react-router";
import Auth from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "התחברות והרשמה | בין השמשות" },
      { name: "description", content: "התחברו או הירשמו לבין השמשות כדי לקבל תזכורות שבת אישיות ולשמור את ההגדרות שלכם." },
      { property: "og:title", content: "התחברות והרשמה | בין השמשות" },
      { property: "og:description", content: "התחברו או הירשמו לבין השמשות כדי לקבל תזכורות שבת אישיות ולשמור את ההגדרות שלכם." },
      { property: "og:url", content: "https://ben-hashmashot.com/auth" },
      { name: "twitter:title", content: "התחברות והרשמה | בין השמשות" },
      { name: "twitter:description", content: "התחברו או הירשמו לבין השמשות כדי לקבל תזכורות שבת אישיות ולשמור את ההגדרות שלכם." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/auth" }],
  }),
  component: Auth,
});
