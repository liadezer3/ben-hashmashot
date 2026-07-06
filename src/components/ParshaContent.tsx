import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PARSHA_LIST = [
  "בראשית", "נח", "לך לך", "וירא", "חיי שרה", "תולדות", "ויצא", "וישלח", "וישב", "מקץ", "ויגש", "ויחי",
  "שמות", "וארא", "בא", "בשלח", "יתרו", "משפטים", "תרומה", "תצוה", "כי תשא", "ויקהל", "פקודי",
  "ויקרא", "צו", "שמיני", "תזריע", "מצורע", "אחרי מות", "קדושים", "אמור", "בהר", "בחוקותי",
  "במדבר", "נשא", "בהעלותך", "שלח", "קורח", "חוקת", "בלק", "פינחס", "מטות", "מסעי",
  "דברים", "ואתחנן", "עקב", "ראה", "שופטים", "כי תצא", "כי תבוא", "ניצבים", "וילך", "האזינו", "וזאת הברכה"
];

// Defense-in-depth: strip any HTML tags / control chars from AI output and cap length
const sanitizeContent = (raw: unknown): string => {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<[^>]*>/g, "") // remove any HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // strip control chars
    .slice(0, 5000)
    .trim();
};

// Simple function to get approximate current parsha based on week of year
const getCurrentParsha = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return PARSHA_LIST[weekNumber % PARSHA_LIST.length];
};

type Audience = "general" | "kids" | "business" | "table";

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: "general", label: "כללי" },
  { key: "kids", label: "לילדים" },
  { key: "business", label: "עסקי" },
  { key: "table", label: "לשולחן שבת" },
];

const ParshaContent = () => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentParsha] = useState(getCurrentParsha());
  const [audience, setAudience] = useState<Audience>("general");
  const { toast } = useToast();

  const generateContent = async (aud: Audience = audience) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-parsha-content', {
        body: { parsha: currentParsha, audience: aud }
      });

      if (error) throw error;
      setContent(sanitizeContent(data?.content));
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לייצר את דבר התורה. נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>דבר תורה - פרשת {currentParsha}</span>
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!content && !loading && (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              קבל דבר תורה מותאם אישית עם קישור לאקטואליה
            </p>
            <Button onClick={generateContent} className="gap-2">
              <Sparkles className="h-4 w-4" />
              צור דבר תורה
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
        )}

        {content && !loading && (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none text-right leading-relaxed whitespace-pre-line">
              {content}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateContent}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              צור דבר תורה חדש
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParshaContent;
