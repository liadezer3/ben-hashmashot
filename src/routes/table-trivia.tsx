import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtrasLayout } from "@/components/ExtrasLayout";
import { TriviaBlock } from "@/components/TriviaBlock";

const T = "חידון שבת ושאלות לשולחן – לילדים, נוער ומבוגרים | בין השמשות";
const D = "חידון שבת שבועי בשלוש רמות קושי וכרטיסיות שאלות פתיחה לשיחה משפחתית סביב שולחן השבת – בלי מסכים.";

export const Route = createFileRoute("/table-trivia")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ben-hashmashot.com/table-trivia" }],
  }),
  component: TableTrivia,
});

function TableTrivia() {
  const [offset, setOffset] = useState(0);
  return (
    <ExtrasLayout title="חידון ושיחה לשולחן שבת" subtitle="5 שאלות לשבוע הזה ושלוש שאלות פתיחה לשיחה. אפשר להדפיס יחד עם דף המקרר.">
      <Button variant="outline" className="gap-2" onClick={() => setOffset((o) => o + 1)}>
        <Shuffle className="h-4 w-4" /> שאלות אחרות
      </Button>
      <TriviaBlock offset={offset} />
    </ExtrasLayout>
  );
}
