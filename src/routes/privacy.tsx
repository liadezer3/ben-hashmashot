import { createFileRoute } from "@tanstack/react-router";
import Privacy from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "מדיניות פרטיות | בין השמשות" },
      { name: "description", content: "כך אתר בין השמשות אוסף, שומר ומגן על המידע האישי שלכם, ואיך ליצור קשר בנושאי פרטיות." },
      { property: "og:title", content: "מדיניות פרטיות | בין השמשות" },
      { property: "og:description", content: "כך אתר בין השמשות אוסף, שומר ומגן על המידע האישי שלכם, ואיך ליצור קשר בנושאי פרטיות." },
      { property: "og:url", content: "https://ben-hashmashot.com/privacy" },
      { name: "twitter:title", content: "מדיניות פרטיות | בין השמשות" },
      { name: "twitter:description", content: "כך אתר בין השמשות אוסף, שומר ומגן על המידע האישי שלכם, ואיך ליצור קשר בנושאי פרטיות." },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/privacy" }],
  }),
  component: Privacy,
});
