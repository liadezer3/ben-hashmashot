import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "בין השמשות – השבת שלי וזמני שבת" },
      { name: "description", content: "זמני כניסת ויציאת שבת בעיר שלך, חלון יציאה חכם וקונסיירז׳ לערב שבת, לצד תכנון וחוויית שבת משפחתית אישית בבין השמשות." },
      { property: "og:title", content: "בין השמשות – השבת שלי וזמני שבת" },
      { property: "og:description", content: "זמני שבת אישיים, תכנון יום שישי וקונסיירז׳ לערב שבת לחוויית שבת משפחתית." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});
