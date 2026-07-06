import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation, Home, MapPin, AlertTriangle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "home-address";

interface NavigateHomeButtonProps {
  candleLighting: string; // e.g. "הדלקת נרות: 19:12" or "19:12"
  minutesToCandles?: number | null;
}

const extractTime = (s: string): string | null => {
  const m = s.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : null;
};

export const NavigateHomeButton = ({ candleLighting, minutesToCandles }: NavigateHomeButtonProps) => {
  const [home, setHome] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [editing, setEditing] = useState(!home);
  const [draft, setDraft] = useState(home);

  const saveHome = () => {
    const value = draft.trim();
    setHome(value);
    localStorage.setItem(STORAGE_KEY, value);
    setEditing(false);
  };

  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(home)}&navigate=yes`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    home
  )}&travelmode=driving`;

  const candleTime = extractTime(candleLighting);
  const tight = typeof minutesToCandles === "number" && minutesToCandles > 0 && minutesToCandles < 90;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Navigation className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">נוסעים לשבת?</h3>
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center gap-1">
            <Home className="w-4 h-4" /> כתובת הבית ליעד הניווט
          </label>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="לדוגמה: הרצל 10, תל אביב"
            />
            <Button onClick={saveHome} disabled={!draft.trim()}>
              שמור
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm flex items-center gap-1 min-w-0">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{home}</span>
            </span>
            <Button variant="ghost" size="icon" onClick={() => { setDraft(home); setEditing(true); }}>
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          {candleTime && (
            <div
              className={cn(
                "text-sm flex items-center gap-2 rounded-lg p-2",
                tight ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground"
              )}
            >
              {tight && <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>
                כניסת שבת בשעה {candleTime}
                {typeof minutesToCandles === "number" && minutesToCandles > 0
                  ? ` — נותרו ${minutesToCandles} דקות. ודאו שתגיעו בזמן!`
                  : ""}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button asChild className="gap-2">
              <a href={wazeUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4" />
                Waze
              </a>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="w-4 h-4" />
                Google Maps
              </a>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default NavigateHomeButton;
