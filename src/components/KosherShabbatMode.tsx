import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface KosherShabbatModeProps {
  isActive: boolean;
  candleLighting?: string;
  havdalah?: string;
  parsha?: string;
  city?: string;
}

/**
 * "Kosher for Shabbat" full-screen static mode.
 * No buttons, no interactions, no animations beyond a gentle fade.
 * Shows only essential static info: greeting, parsha, times.
 * User can manually exit via small X (in case they entered by accident).
 */
export const KosherShabbatMode = ({
  isActive,
  candleLighting,
  havdalah,
  parsha,
  city,
}: KosherShabbatModeProps) => {
  const [enabled, setEnabled] = useState(true);

  // Reset when phase changes back
  useEffect(() => {
    if (!isActive) setEnabled(true);
  }, [isActive]);

  if (!isActive || !enabled) return null;

  // Check user preference
  const userDisabled = localStorage.getItem("kosher_shabbat_mode") === "false";
  if (userDisabled) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center",
        "bg-gradient-to-b from-background via-background to-primary/5",
        "animate-in fade-in duration-1000"
      )}
      dir="rtl"
      role="dialog"
      aria-label="מצב כשר לשבת"
    >
      {/* Discrete exit button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 opacity-30 hover:opacity-100"
        onClick={() => setEnabled(false)}
        title="סגור מצב כשר לשבת"
        aria-label="סגור"
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="text-center space-y-8 px-6 max-w-md">
        {/* Candle */}
        <div className="text-7xl" aria-hidden="true">🕯️</div>

        {/* Greeting */}
        <div>
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-2">שבת שלום</h1>
          <p className="text-lg text-muted-foreground">מצב כשר לשבת פעיל</p>
        </div>

        {/* Parsha */}
        {parsha && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">פרשת השבוע</div>
            <div className="text-2xl font-semibold">{parsha}</div>
          </div>
        )}

        {/* Times */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
          {candleLighting && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">הדלקת נרות</div>
              <div className="text-2xl font-bold">{candleLighting}</div>
            </div>
          )}
          {havdalah && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">צאת השבת</div>
              <div className="text-2xl font-bold">{havdalah}</div>
            </div>
          )}
        </div>

        {city && (
          <div className="text-sm text-muted-foreground pt-2">{city}</div>
        )}

        <p className="text-xs text-muted-foreground/60 pt-8 italic">
          המסך אינו אינטראקטיבי בזמן השבת
        </p>
      </div>
    </div>
  );
};
