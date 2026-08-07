import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Copy, Loader2, RefreshCw, Link2Off, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BotLink {
  id: string;
  channel: string;
  external_id: string;
  linked_at: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  telegram: "טלגרם",
  whatsapp: "וואטסאפ",
};

export const BotConnectionCard = () => {
  const [links, setLinks] = useState<BotLink[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const loadLinks = async () => {
    const { data, error } = await supabase
      .from("bot_links")
      .select("id, channel, external_id, linked_at")
      .order("linked_at", { ascending: false });
    if (error) console.error("bot_links load error", error.message);
    setLinks(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const generateCode = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("create_bot_link_code");
    setGenerating(false);
    if (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור קוד חיבור. ודא שאתה מחובר לחשבון.",
        variant: "destructive",
      });
      return;
    }
    setCode(data as string);
  };

  const copyCommand = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(`/connect ${code}`);
    toast({ title: "הועתק", description: "הדבק את הפקודה בצ'אט עם הבוט." });
  };

  const disconnect = async (id: string) => {
    const { error } = await supabase.from("bot_links").delete().eq("id", id);
    if (error) {
      toast({ title: "שגיאה", description: "הניתוק נכשל.", variant: "destructive" });
      return;
    }
    toast({ title: "נותק", description: "החשבון נותק מהבוט." });
    loadLinks();
  };

  return (
    <Card className="p-5 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">חיבור לבוט</h3>
        {links.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            מחובר
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        הבוט עונה אוטומטית על זמני שבת, זמני הלכה, פרשת השבוע ומידע על האפליקציה. אחרי חיבור
        החשבון הוא יוכל לענות גם על הנתונים האישיים שלך — רשימת קניות, אורחים, משימות והגדרות התראות.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> טוען...
        </div>
      ) : (
        <>
          {links.length > 0 && (
            <div className="space-y-2 mb-4">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div className="text-sm">
                    <span className="font-medium">
                      {CHANNEL_LABELS[link.channel] ?? link.channel}
                    </span>
                    <span className="text-muted-foreground"> · </span>
                    <span dir="ltr" className="text-muted-foreground">
                      {link.external_id}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => disconnect(link.id)}>
                    <Link2Off className="w-4 h-4 ml-1" />
                    נתק
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {code ? (
              <div className="rounded-lg bg-muted/60 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  קוד החיבור שלך (תקף ל-15 דקות):
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono tracking-widest" dir="ltr">
                    /connect {code}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyCommand}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            <Button onClick={generateCode} disabled={generating} variant={code ? "outline" : "default"}>
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              {code ? "צור קוד חדש" : "צור קוד חיבור"}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1 pt-1">
              <p className="font-medium text-foreground">איך מחברים?</p>
              <p>1. לחץ על "צור קוד חיבור" למעלה.</p>
              <p>
                2. פתח צ'אט עם הבוט — בטלגרם, או בוואטסאפ למספר{" "}
                <span dir="ltr">054-528-3419</span>.
              </p>
              <p>3. שלח לבוט את הפקודה שהעתקת, למשל <span dir="ltr">/connect ABC12345</span>.</p>
              <p>4. אחר כך אפשר לשאול אותו כל שאלה בעברית — הוא מסתנכרן עם האתר בזמן אמת.</p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default BotConnectionCard;
