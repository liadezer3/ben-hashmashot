import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Copy, Loader2, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActiveCode {
  code: string;
  expires_at: string;
}

export const TelegramBotConnection = () => {
  const [activeCode, setActiveCode] = useState<ActiveCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadActiveCode = async () => {
    const { data, error } = await supabase
      .from("bot_link_codes")
      .select("code, expires_at")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error("bot_link_codes load error", error.message);
    setActiveCode(data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    loadActiveCode();
  }, []);

  const generateCode = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("create_bot_link_code");
    setGenerating(false);
    if (error) {
      toast.error("לא הצלחנו ליצור קוד חיבור. ודא שאתה מחובר לחשבון.");
      return;
    }
    await loadActiveCode();
    if (!activeCode && data) {
      setActiveCode({
        code: data as string,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    }
    toast.success("נוצר קוד חיבור חדש");
  };

  const copyCode = async () => {
    if (!activeCode) return;
    await navigator.clipboard.writeText(`/connect ${activeCode.code}`);
    toast.success("הועתק — הדבק את הפקודה בצ'אט עם הבוט");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-primary" />
          חיבור לבוט טלגרם
        </CardTitle>
        <CardDescription>
          חבר את החשבון שלך לבוט כדי לקבל תשובות אוטומטיות גם על הנתונים האישיים שלך
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> טוען...
          </div>
        ) : activeCode ? (
          <div className="rounded-lg bg-muted/60 p-4 space-y-3">
            <p className="text-xs text-muted-foreground">קוד החיבור שלך (תקף ל-15 דקות):</p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-mono font-bold tracking-widest" dir="ltr">
                {activeCode.code}
              </code>
              <Button variant="outline" size="icon" onClick={copyCode} aria-label="העתק קוד">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={generateCode} disabled={generating} variant="outline" size="sm">
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              צור קוד חדש
            </Button>
          </div>
        ) : (
          <Button onClick={generateCode} disabled={generating}>
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <RefreshCw className="w-4 h-4 ml-2" />
            )}
            צור קוד חיבור
          </Button>
        )}

        <div className="text-sm text-muted-foreground space-y-1 pt-1">
          <p className="font-medium text-foreground flex items-center gap-1">
            <Send className="w-4 h-4" /> איך מחברים?
          </p>
          <p>
            שלח לבוט{" "}
            <a
              href="https://t.me/botshabbat_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
              dir="ltr"
            >
              @botshabbat_bot
            </a>{" "}
            הודעה:{" "}
            <code dir="ltr" className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">
              /connect {activeCode?.code ?? "YOURCODE"}
            </code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramBotConnection;
