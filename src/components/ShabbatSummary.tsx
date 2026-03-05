import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShabbatSummaryProps {
  userId: string;
}

export const ShabbatSummary = ({ userId }: ShabbatSummaryProps) => {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("shabbat-summary", {
        body: { userId },
      });
      if (error) throw error;
      if (data?.summary) setSummary(data.summary);
    } catch {
      toast.error("שגיאה ביצירת סיכום");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          סיכום שבת שבועי
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary && (
          <Button onClick={generateSummary} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "מייצר סיכום..." : "צור סיכום שבוע"}
          </Button>
        )}

        {summary && (
          <div className="prose prose-sm max-w-none" dir="rtl">
            <div className="p-4 rounded-lg bg-muted whitespace-pre-line text-sm leading-relaxed">
              {summary}
            </div>
            <Button variant="ghost" onClick={generateSummary} disabled={loading} className="w-full mt-2 text-sm">
              רענן סיכום
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
