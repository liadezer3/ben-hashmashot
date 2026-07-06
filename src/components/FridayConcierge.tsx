import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface FridayConciergeProps {
  city: string;
  candleLighting: string;
  havdalah: string;
  parsha: string;
}

const SUGGESTIONS = [
  "צריך לקנות לשבת, לבשל ולנקות — תעזור לי לתכנן",
  "בנה לי לו\"ז ליום שישי",
  "מה כדאי להכין קודם כדי להספיק?",
];

export const FridayConcierge = ({ city, candleLighting, havdalah, parsha }: FridayConciergeProps) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Placeholder assistant message we stream into
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/friday-concierge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: nextMessages,
            city,
            candleLighting,
            havdalah,
            parsha,
          }),
        }
      );

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("יותר מדי בקשות, נסה שוב עוד רגע");
        if (resp.status === 402) throw new Error("נגמרו הקרדיטים של ה-AI");
        throw new Error("שגיאה בחיבור לעוזר");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;
          const payload = trimmedLine.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }
          } catch {
            // ignore partial JSON
          }
        }
      }
    } catch (err: any) {
      console.error("concierge error", err);
      setMessages((m) => m.slice(0, -1)); // remove empty assistant msg
      toast({
        title: "שגיאה",
        description: err.message || "לא הצלחנו לקבל תשובה מהעוזר.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">קונסיירז' ערב שבת</h3>
        <Sparkles className="w-4 h-4 text-yellow-500" />
      </div>

      {messages.length === 0 ? (
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            ספר לי מה צריך לעשות היום ואבנה לך לו"ז מותאם כדי להספיק הכל לפני כניסת השבת.
          </p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="justify-start text-right h-auto py-2 whitespace-normal"
                onClick={() => send(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <ScrollArea className="h-[320px] pr-2 mb-3" ref={scrollRef as any}>
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "bg-primary/10 rounded-lg p-3 ml-6"
                    : "bg-muted/50 rounded-lg p-3 mr-6"
                }
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-right leading-relaxed">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-line">{m.content}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="כתוב כאן..."
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </Card>
  );
};

export default FridayConcierge;
