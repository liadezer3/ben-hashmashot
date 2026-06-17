import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MailX, CheckCircle2, AlertTriangle } from "lucide-react";

type State = "loading" | "valid" | "confirming" | "success" | "invalid" | "used";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (res.ok && data.valid) setState(data.used ? "used" : "valid");
        else setState(data.used ? "used" : "invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("confirming");
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      setState(error ? "invalid" : "success");
    } catch {
      setState("invalid");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-3">
            {state === "loading" || state === "confirming" ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : state === "success" || state === "used" ? (
              <CheckCircle2 className="h-10 w-10 text-primary" />
            ) : state === "valid" ? (
              <MailX className="h-10 w-10 text-primary" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-destructive" />
            )}
            ביטול הרשמה לדיוור
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && <p className="text-muted-foreground">בודק את הקישור...</p>}
          {state === "valid" && (
            <>
              <p className="text-muted-foreground">
                האם להפסיק לקבל הודעות דוא"ל מבין השמשות?
              </p>
              <Button onClick={confirm} className="w-full">
                אישור ביטול ההרשמה
              </Button>
            </>
          )}
          {state === "confirming" && <p className="text-muted-foreground">מבטל הרשמה...</p>}
          {state === "success" && (
            <p className="text-muted-foreground">
              ההרשמה בוטלה בהצלחה. לא תקבל עוד הודעות דוא"ל.
            </p>
          )}
          {state === "used" && (
            <p className="text-muted-foreground">ההרשמה כבר בוטלה בעבר.</p>
          )}
          {state === "invalid" && (
            <p className="text-muted-foreground">הקישור אינו תקין או שפג תוקפו.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
