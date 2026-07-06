import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Clock, RefreshCw, CloudSun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SmartDepartureCardProps {
  city: string;
  candleLighting: string;
}

export const SmartDepartureCard = ({ city, candleLighting }: SmartDepartureCardProps) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const { toast } = useToast();

  const analyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("time-optimizer", {
        body: { city, candleLighting },
      });
      if (error) throw error;
      setRecommendation(data?.recommendation || "");
      setWeather(data?.weather || null);
    } catch (err: any) {
      console.error("time-optimizer error", err);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לחשב חלון זמן אופטימלי כרגע.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">חלון יציאה אופטימלי</h3>
        <Sparkles className="w-4 h-4 text-yellow-500" />
      </div>

      {!recommendation && !loading && (
        <div className="text-center py-2">
          <p className="text-muted-foreground text-sm mb-4">
            המלצה חכמה מבוססת מזג אוויר ועומסי תנועה — מתי כדאי לצאת מהעבודה כדי להספיק לפני כניסת שבת.
          </p>
          <Button onClick={analyze} className="gap-2">
            <Sparkles className="w-4 h-4" />
            קבל המלצה חכמה
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[70%]" />
        </div>
      )}

      {recommendation && !loading && (
        <div className="space-y-3">
          {weather && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CloudSun className="w-4 h-4" />
              {weather}
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line">{recommendation}</p>
          <Button variant="outline" size="sm" onClick={analyze} className="gap-2">
            <RefreshCw className="w-3 h-3" />
            רענן המלצה
          </Button>
        </div>
      )}
    </Card>
  );
};

export default SmartDepartureCard;
