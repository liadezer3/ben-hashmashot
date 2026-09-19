import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, MapPin, Globe, BookOpen, Clock, BellOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import {
  useUserPreferences,
  ObservanceLevel,
  ZmanimPreset,
  AppLanguage,
  UserPreferencesUpdate,
} from "@/hooks/useUserPreferences";
import { CitySelector } from "@/components/CitySelector";
import { TelegramBotConnection } from "@/components/TelegramBotConnection";

// City coordinates for resolving location data
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "Jerusalem": { lat: 31.7683, lon: 35.2137 },
  "Tel Aviv": { lat: 32.0853, lon: 34.7818 },
  "Haifa": { lat: 32.7940, lon: 34.9896 },
  "Beersheba": { lat: 31.2530, lon: 34.7915 },
  "Netanya": { lat: 32.3286, lon: 34.8569 },
  "Bnei Brak": { lat: 32.0836, lon: 34.8331 },
  "Ramat Gan": { lat: 32.0680, lon: 34.8248 },
  "Ashdod": { lat: 31.8014, lon: 34.6431 },
  "Petah Tikva": { lat: 32.0841, lon: 34.8878 },
  "Rishon LeZion": { lat: 31.9730, lon: 34.7925 },
  "Holon": { lat: 32.0158, lon: 34.7731 },
  "Ashkelon": { lat: 31.6688, lon: 34.5743 },
  "Rehovot": { lat: 31.8928, lon: 34.8113 },
  "Bat Yam": { lat: 32.0171, lon: 34.7503 },
  "Herzliya": { lat: 32.1663, lon: 34.8464 },
  "Kfar Saba": { lat: 32.1713, lon: 34.9064 },
  "Modiin": { lat: 31.8969, lon: 35.0104 },
  "Raanana": { lat: 32.1832, lon: 34.8708 },
  "Lod": { lat: 31.9514, lon: 34.8951 },
  "Ramla": { lat: 31.9279, lon: 34.8664 },
  "Nazareth": { lat: 32.7021, lon: 35.2978 },
  "Acre": { lat: 32.9330, lon: 35.0767 },
  "Tiberias": { lat: 32.7922, lon: 35.5312 },
  "Safed": { lat: 32.9646, lon: 35.4969 },
  "Eilat": { lat: 29.5577, lon: 34.9519 },
};

const OBSERVANCE_OPTIONS: { value: ObservanceLevel; label: string; description: string; emoji: string }[] = [
  { value: "religious", label: "דתי", description: "כל התכנים ההלכתיים, פרשה, דף יומי, זמנים מדויקים", emoji: "📖" },
  { value: "traditional", label: "מסורתי", description: "זמני שבת, הדלקת נרות, תכנים נבחרים", emoji: "🕯️" },
  { value: "secular", label: "חילוני", description: "זמני שבת בסיסיים, תכנים קהילתיים ותרבותיים", emoji: "🌅" },
];

const ZMANIM_PRESETS: { value: ZmanimPreset; label: string; description: string }[] = [
  { value: "strict", label: "מחמיר", description: "רבנו תם, זמנים מוקדמים יותר" },
  { value: "standard", label: "סטנדרטי", description: "לפי הגאונים, המנהג הנפוץ" },
  { value: "lenient", label: "מקל", description: "שקיעה רגילה, הבדלה מוקדמת" },
  { value: "custom", label: "מותאם אישית", description: "הגדר אופסטים ידנית" },
];

const LANGUAGE_OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: "he", label: "עברית" },
  { value: "en", label: "English" },
];

export default function UserPreferencesPanel() {
  const { preferences, isLoading, updatePreferencesAsync, isUpdating } = useUserPreferences();

  const [observance, setObservance] = useState<ObservanceLevel>("traditional");
  const [language, setLanguage] = useState<AppLanguage>("he");
  const [zmanimPreset, setZmanimPreset] = useState<ZmanimPreset>("standard");
  const [minhag, setMinhag] = useState("");
  const [silentDuringShabbat, setSilentDuringShabbat] = useState(true);
  const [city, setCity] = useState("Jerusalem");
  const [candleOffset, setCandleOffset] = useState(18);
  const [shkiahOffset, setShkiahOffset] = useState(0);
  const [tzeitOffset, setTzeitOffset] = useState(40);
  const [dirty, setDirty] = useState(false);

  // Sync form from server data
  useEffect(() => {
    if (!preferences) return;
    setObservance(preferences.observance_level);
    setLanguage(preferences.language);
    setZmanimPreset(preferences.zmanim_preset);
    setMinhag(preferences.minhag ?? "");
    setSilentDuringShabbat(preferences.silent_during_shabbat);
    if (preferences.custom_offsets) {
      setCandleOffset(preferences.custom_offsets.candleLightingMinutesBefore);
      setShkiahOffset(preferences.custom_offsets.shkiahOffset);
      setTzeitOffset(preferences.custom_offsets.tzeitOffset);
    }
    // Resolve city from stored location
    if (preferences.location) {
      let bestCity = "Jerusalem";
      let minDist = Infinity;
      for (const [name, coords] of Object.entries(CITY_COORDS)) {
        const d = Math.abs(coords.lat - preferences.location.lat) + Math.abs(coords.lon - preferences.location.lon);
        if (d < minDist) { minDist = d; bestCity = name; }
      }
      setCity(bestCity);
    }
    setDirty(false);
  }, [preferences]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    const coords = CITY_COORDS[city];

    const updates: UserPreferencesUpdate = {
      observance_level: observance,
      language,
      zmanim_preset: zmanimPreset,
      minhag: minhag.trim() || null,
      silent_during_shabbat: silentDuringShabbat,
      timezone: "Asia/Jerusalem",
      location: coords
        ? { lat: coords.lat, lon: coords.lon, tz: "Asia/Jerusalem" }
        : null,
    };

    if (zmanimPreset === "custom") {
      updates.custom_offsets = {
        candleLightingMinutesBefore: candleOffset,
        shkiahOffset,
        tzeitOffset,
      };
    }

    try {
      await updatePreferencesAsync(updates);
      setDirty(false);
    } catch {
      // error handled by hook
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="mr-2 text-muted-foreground">טוען העדפות...</span>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Observance Level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            רמת שמירת מצוות
          </CardTitle>
          <CardDescription>בחר את הרמה שתתאים לך — זה ישפיע על התכנים שיוצגו</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={observance}
            onValueChange={(v) => { setObservance(v as ObservanceLevel); markDirty(); }}
            className="space-y-3"
          >
            {OBSERVANCE_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  observance === opt.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <RadioGroupItem value={opt.value} id={`obs-${opt.value}`} className="mt-1" />
                <Label htmlFor={`obs-${opt.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="font-semibold">{opt.label}</span>
                    {observance === opt.value && (
                      <Badge variant="secondary" className="text-xs">נבחר</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Language & Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-primary" />
            שפה ומיקום
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>שפת האפליקציה</Label>
            <Select value={language} onValueChange={(v) => { setLanguage(v as AppLanguage); markDirty(); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <CitySelector
            value={city}
            onChange={(c) => { setCity(c); markDirty(); }}
            label="מיקום ראשי (לחישוב זמנים)"
            showGpsButton
          />
        </CardContent>
      </Card>

      {/* Telegram Bot Connection */}
      <TelegramBotConnection />

      {/* Zmanim Preset */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            פריסט זמנים הלכתיים
          </CardTitle>
          <CardDescription>בחר את שיטת חישוב הזמנים המועדפת</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={zmanimPreset}
            onValueChange={(v) => { setZmanimPreset(v as ZmanimPreset); markDirty(); }}
            className="space-y-2"
          >
            {ZMANIM_PRESETS.map((preset) => (
              <div
                key={preset.value}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  zmanimPreset === preset.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <RadioGroupItem value={preset.value} id={`preset-${preset.value}`} />
                <Label htmlFor={`preset-${preset.value}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-sm text-muted-foreground mr-2">— {preset.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Custom offsets */}
          {zmanimPreset === "custom" && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-dashed border-primary/30 space-y-3">
              <p className="text-sm font-medium">אופסטים מותאמים אישית (בדקות)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">הדלקת נרות (לפני שקיעה)</Label>
                  <Input
                    type="number"
                    value={candleOffset}
                    onChange={(e) => { setCandleOffset(Number(e.target.value)); markDirty(); }}
                    min={0}
                    max={60}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">אופסט שקיעה</Label>
                  <Input
                    type="number"
                    value={shkiahOffset}
                    onChange={(e) => { setShkiahOffset(Number(e.target.value)); markDirty(); }}
                    min={-30}
                    max={30}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">צאת הכוכבים (אחרי שקיעה)</Label>
                  <Input
                    type="number"
                    value={tzeitOffset}
                    onChange={(e) => { setTzeitOffset(Number(e.target.value)); markDirty(); }}
                    min={20}
                    max={72}
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Minhag */}
          <div className="space-y-2">
            <Label>מנהג / קהילה (אופציונלי)</Label>
            <Input
              value={minhag}
              onChange={(e) => { setMinhag(e.target.value); markDirty(); }}
              placeholder="למשל: אשכנזי-ליטאי, תימני, ספרדי..."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">טקסט חופשי לתיעוד המסורת שלך</p>
          </div>
        </CardContent>
      </Card>

      {/* Shabbat Mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {silentDuringShabbat ? (
              <BellOff className="w-5 h-5 text-primary" />
            ) : (
              <Volume2 className="w-5 h-5 text-primary" />
            )}
            מצב שבת
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-medium">מצב שקט בשבת</p>
              <p className="text-sm text-muted-foreground">השתק התראות בזמן שבת וחג</p>
            </div>
            <Switch
              checked={silentDuringShabbat}
              onCheckedChange={(v) => { setSilentDuringShabbat(v); markDirty(); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!dirty || isUpdating}
        className="w-full gap-2"
        size="lg"
      >
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isUpdating ? "שומר..." : "שמור העדפות"}
      </Button>
    </div>
  );
}
