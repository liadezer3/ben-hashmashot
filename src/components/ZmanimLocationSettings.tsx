import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Navigation, RotateCcw, Save, Moon, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_CITIES } from "@/lib/cities";
import {
  getBaseCityCoords,
  getCityCoords,
  getCityOverride,
  setCityOverride,
  clearCityOverride,
} from "@/lib/cityCoords";
import {
  getShabbatZmanim,
  getZmanimSettings,
  setZmanimSettings,
  HAVDALAH_LABELS,
  HavdalahMethod,
} from "@/lib/shabbatZmanim";

/**
 * Lets the user fine-tune the exact coordinates of their settlement
 * (e.g. Maale Adumim) plus the candle-lighting offset and the havdalah method,
 * so times match the official Israeli luach exactly.
 */
export const ZmanimLocationSettings = () => {
  const { toast } = useToast();
  const [city, setCity] = useState("Jerusalem");
  const [customName, setCustomName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [elevation, setElevation] = useState("");
  const [candleMinutes, setCandleMinutes] = useState("");
  const [havdalahMethod, setHavdalahMethod] = useState<HavdalahMethod>(
    getZmanimSettings().havdalahMethod
  );
  const [version, setVersion] = useState(0);

  const activeCity = customName.trim() || city;

  useEffect(() => {
    const coords = getCityCoords(activeCity);
    setLat(String(coords.lat));
    setLon(String(coords.lon));
    setElevation(String(coords.elevation));
    setCandleMinutes(String(coords.candleMinutes));
  }, [activeCity]);

  const preview = useMemo(() => {
    try {
      return getShabbatZmanim(activeCity);
    } catch {
      return null;
    }
  }, [activeCity, version]);

  const hasOverride = Boolean(getCityOverride(activeCity));

  const handleDetect = () => {
    if (!navigator.geolocation) {
      toast({ title: "שגיאה", description: "הדפדפן לא תומך בזיהוי מיקום", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        if (pos.coords.altitude != null) setElevation(String(Math.round(pos.coords.altitude)));
        toast({ title: "✅ המיקום זוהה", description: "בדוק ולחץ שמירה" });
      },
      () => toast({ title: "שגיאה", description: "לא הצלחנו לזהות מיקום", variant: "destructive" }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = () => {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const minutes = parseInt(candleMinutes, 10);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast({ title: "קו רוחב שגוי", description: "יש להזין מספר בין -90 ל-90", variant: "destructive" });
      return;
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      toast({ title: "קו אורך שגוי", description: "יש להזין מספר בין -180 ל-180", variant: "destructive" });
      return;
    }
    if (isNaN(minutes) || minutes < 0 || minutes > 90) {
      toast({ title: "דקות שגויות", description: "הדלקת נרות: 0 עד 90 דקות לפני השקיעה", variant: "destructive" });
      return;
    }

    setCityOverride(activeCity, {
      lat: latNum,
      lon: lonNum,
      elevation: parseInt(elevation, 10) || 0,
      candleMinutes: minutes,
    });
    setZmanimSettings({ havdalahMethod });
    setVersion((v) => v + 1);
    toast({ title: "נשמר", description: `הזמנים עבור ${activeCity} עודכנו` });
  };

  const handleReset = () => {
    clearCityOverride(activeCity);
    const base = getBaseCityCoords(activeCity);
    setLat(String(base.lat));
    setLon(String(base.lon));
    setElevation(String(base.elevation));
    setCandleMinutes(String(base.candleMinutes));
    setVersion((v) => v + 1);
    toast({ title: "אופס", description: "חזרנו לערכי ברירת המחדל" });
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          כיול זמני שבת מדויקים (קווי אורך ורוחב)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          החישוב מתבצע מקומית לפי הסטנדרט המקובל בישראל: הדלקת נרות דקות ספורות לפני
          השקיעה, וצאת שבת לפי צאת הכוכבים בארץ.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>יישוב מהרשימה</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CITIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.hebrewName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>או יישוב חופשי (למשל מעלה אדומים)</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="שם היישוב"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>קו רוחב (Latitude)</Label>
            <Input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>קו אורך (Longitude)</Label>
            <Input value={lon} onChange={(e) => setLon(e.target.value)} inputMode="decimal" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>גובה (מטרים)</Label>
            <Input value={elevation} onChange={(e) => setElevation(e.target.value)} inputMode="numeric" dir="ltr" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              הדלקת נרות — דקות לפני השקיעה
            </Label>
            <Select value={candleMinutes} onValueChange={setCandleMinutes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[18, 20, 22, 25, 30, 40].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} דקות{m === 20 ? " (ברירת המחדל בארץ)" : m === 40 ? " (ירושלים)" : m === 30 ? " (חיפה / פתח תקווה)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-primary" />
              שיטת צאת השבת
            </Label>
            <Select value={havdalahMethod} onValueChange={(v) => setHavdalahMethod(v as HavdalahMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(HAVDALAH_LABELS) as HavdalahMethod[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {HAVDALAH_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            שמור כיול
          </Button>
          <Button variant="outline" onClick={handleDetect} className="gap-2">
            <Navigation className="w-4 h-4" />
            זהה מיקום מדויק
          </Button>
          {hasOverride && (
            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              אפס לברירת מחדל
            </Button>
          )}
        </div>

        {preview && (
          <div className="rounded-lg border border-border bg-background/50 p-4 text-sm space-y-1">
            <p className="font-semibold">תצוגה מקדימה — {activeCity}</p>
            <p>שקיעה: <span className="font-bold">{preview.sunsetTime}</span></p>
            <p>הדלקת נרות ({preview.candleMinutes} דק' לפני השקיעה): <span className="font-bold">{preview.candleLightingTime}</span></p>
            <p>צאת השבת: <span className="font-bold">{preview.havdalahTime}</span></p>
            <p>פרשת השבוע: <span className="font-bold">{preview.parsha}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ZmanimLocationSettings;
