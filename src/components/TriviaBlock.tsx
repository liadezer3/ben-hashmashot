import { useState } from "react";
import { getWeeklyTrivia, getWeeklyCards } from "@/lib/shabbatExtras";

export function TriviaBlock({ offset = 0, printMode = false }: { offset?: number; printMode?: boolean }) {
  const trivia = getWeeklyTrivia(offset);
  const cards = getWeeklyCards(3, offset);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">חידון לשולחן</h2>
        <ol className="space-y-3">
          {trivia.map((t, i) => (
            <li key={t.q} className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-primary font-medium mb-1">{t.level}</div>
              <p className="font-medium">{i + 1}. {t.q}</p>
              {!printMode && (
                <button
                  onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                  className="mt-2 text-sm text-primary underline-offset-4 hover:underline print:hidden"
                >
                  {open[i] ? "הסתר תשובה" : "הצג תשובה"}
                </button>
              )}
              {open[i] && !printMode && <p className="mt-2 text-sm text-muted-foreground">{t.a}</p>}
            </li>
          ))}
        </ol>
        {printMode && (
          <p className="text-xs text-muted-foreground" style={{ transform: "rotate(180deg)" }}>
            תשובות: {trivia.map((t, i) => `${i + 1}) ${t.a}`).join(" · ")}
          </p>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">שאלות פתיחה לשיחה</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <div key={c} className="rounded-xl bg-secondary p-4 text-secondary-foreground text-sm leading-relaxed">
              {c}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
