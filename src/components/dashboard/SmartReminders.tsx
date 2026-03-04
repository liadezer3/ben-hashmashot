import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SmartRemindersProps {
  userId: string;
}

interface Reminder {
  text: string;
  type: "task" | "habit" | "tip";
  emoji: string;
}

export const SmartReminders = ({ userId }: SmartRemindersProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const generateReminders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-reminders", {
        body: { userId },
      });

      if (error) throw error;

      if (data?.reminders) {
        setReminders(data.reminders);
      }
      setLoaded(true);
    } catch (err) {
      toast.error("שגיאה ביצירת תזכורות חכמות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          תזכורות חכמות
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!loaded && (
          <Button onClick={generateReminders} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "מנתח את ההרגלים שלך..." : "קבל תזכורות מותאמות אישית"}
          </Button>
        )}

        {reminders.map((reminder, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <span className="text-xl flex-shrink-0">{reminder.emoji}</span>
            <p className="text-sm">{reminder.text}</p>
          </div>
        ))}

        {loaded && reminders.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            דרג כמה שבתות ושמור זכרונות כדי לקבל תזכורות מותאמות 🧠
          </p>
        )}

        {loaded && reminders.length > 0 && (
          <Button variant="ghost" onClick={generateReminders} disabled={loading} className="w-full text-sm">
            רענן תזכורות
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
