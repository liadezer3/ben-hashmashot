import { createFileRoute } from "@tanstack/react-router";
import Terms from "@/pages/Terms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "תנאי שימוש | בין השמשות" },
      { name: "description", content: "תנאי השימוש באתר ובאפליקציית בין השמשות – זמני שבת, תזכורות ושירותי קהילה." },
      { property: "og:title", content: "תנאי שימוש | בין השמשות" },
      { property: "og:description", content: "תנאי השימוש באתר ובאפליקציית בין השמשות – זמני שבת, תזכורות ושירותי קהילה." },
      { property: "og:url", content: "https://ben-hashmashot.com/terms" },
      { name: "twitter:title", content: "תנאי שימוש | בין השמשות" },
      { name: "twitter:description", content: "תנאי השימוש באתר ובאפליקציית בין השמשות – זמני שבת, תזכורות ושירותי קהילה." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/terms" }],
  }),
  component: Terms,
});
