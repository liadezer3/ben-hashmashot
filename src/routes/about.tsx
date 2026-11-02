import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "אודות בין השמשות" },
      { name: "description", content: "הכירו את בין השמשות – מיזם דיגיטלי לזמני שבת וחג, תזכורות אוטומטיות ותיעוד רגעי השבת בקהילה." },
      { property: "og:title", content: "אודות בין השמשות" },
      { property: "og:description", content: "הכירו את בין השמשות – מיזם דיגיטלי לזמני שבת וחג, תזכורות אוטומטיות ותיעוד רגעי השבת בקהילה." },
      { property: "og:url", content: "https://ben-hashmashot.com/about" },
      { name: "twitter:title", content: "אודות בין השמשות" },
      { name: "twitter:description", content: "הכירו את בין השמשות – מיזם דיגיטלי לזמני שבת וחג, תזכורות אוטומטיות ותיעוד רגעי השבת בקהילה." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/about" }],
  }),
  component: About,
});
