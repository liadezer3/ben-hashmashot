import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface AutomationEvent {
  id: string;
  automation_type: string;
  platform: string;
  action: string;
  status: string;
  details: string | null;
  scheduled_time: string | null;
  executed_at: string;
}

interface AutomationHistoryProps {
  userId: string;
}

export const AutomationHistory = ({ userId }: AutomationHistoryProps) => {
  const [history, setHistory] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("automation_history")
        .select("*")
        .eq("user_id", userId)
        .order("executed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error("Error loading automation history:", error);
      toast({
        title: "שגיאה בטעינת היסטוריה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from("automation_history")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setHistory([]);
      toast({
        title: "ההיסטוריה נמחקה",
        description: "כל רשומות האוטומציה נמחקו בהצלחה",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה במחיקת היסטוריה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "shabbat" ? "כניסת שבת" : "מוצאי שבת";
  };

  const getPlatformLabel = (platform: string) => {
    return platform === "home_assistant" ? "Home Assistant" : "Philips Hue";
  };

  const getActionLabel = (action: string) => {
    const actions: Record<string, string> = {
      dim_lights: "עמעום אורות",
      turn_off_lights: "כיבוי אורות",
      turn_on_lights: "הדלקת אורות",
      close_covers: "סגירת תריסים",
      open_covers: "פתיחת תריסים",
    };
    return actions[action] || action;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">היסטוריית אוטומציות</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">היסטוריית אוטומציות</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>אין היסטוריית אוטומציות עדיין</p>
          <p className="text-sm mt-1">כאשר האוטומציות יופעלו, הן יופיעו כאן</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {history.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(event.status)}
                    <Badge variant={event.automation_type === "shabbat" ? "default" : "secondary"}>
                      {getTypeLabel(event.automation_type)}
                    </Badge>
                    <Badge variant="outline">
                      {getPlatformLabel(event.platform)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.executed_at), "dd/MM/yyyy HH:mm", { locale: he })}
                  </span>
                </div>
                <p className="text-sm font-medium">{getActionLabel(event.action)}</p>
                {event.details && (
                  <p className="text-xs text-muted-foreground mt-1">{event.details}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};

// Helper function to log automation events - export for use in other components
export const logAutomationEvent = async (
  userId: string,
  automationType: "shabbat" | "motzei",
  platform: "home_assistant" | "philips_hue",
  action: string,
  status: "success" | "failed" | "pending",
  details?: string,
  scheduledTime?: Date
) => {
  try {
    await supabase.from("automation_history").insert({
      user_id: userId,
      automation_type: automationType,
      platform,
      action,
      status,
      details,
      scheduled_time: scheduledTime?.toISOString(),
    });
  } catch (error) {
    console.error("Failed to log automation event:", error);
  }
};
