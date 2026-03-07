import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Synagogue {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  isOpen?: boolean;
}

export const SynagoguesFinder = () => {
  const [synagogues, setSynagogues] = useState<Synagogue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const findNearby = async () => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const { latitude, longitude } = position.coords;

      const { data, error } = await supabase.functions.invoke("find-synagogues", {
        body: { lat: latitude, lng: longitude },
      });

      if (error) {
        const edgeError = error as any;
        const payload = await edgeError?.context?.json?.().catch(() => null);
        const message = payload?.error || error.message;
        throw new Error(message);
      }

      setSynagogues(data?.results || []);
      setSearched(true);
    } catch (err: any) {
      const errorMessage = String(err?.message || "");
      if (err?.code === 1) {
        toast.error("יש לאשר גישה למיקום כדי למצוא בתי כנסת קרובים");
      } else if (errorMessage.includes("Google Places key is invalid") || errorMessage.includes("REQUEST_DENIED")) {
        toast.error("שירות בתי הכנסת לא זמין כרגע (מפתח Google Places לא תקין)");
      } else {
        toast.error("שגיאה בחיפוש בתי כנסת");
      }
    } finally {
      setLoading(false);
    }
  };

  const openInWaze = (lat: number, lng: number) => {
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, "_blank");
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          בתי כנסת קרובים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!searched && (
          <Button onClick={findNearby} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {loading ? "מחפש..." : "מצא בתי כנסת ליד המיקום שלי"}
          </Button>
        )}

        {searched && synagogues.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            לא נמצאו בתי כנסת בקרבת מקום 🕍
          </p>
        )}

        {synagogues.map((syn, i) => (
          <div key={i} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted">
            <div className="min-w-0">
              <p className="font-medium text-sm">{syn.name}</p>
              <p className="text-xs text-muted-foreground">{syn.address}</p>
              {syn.rating && (
                <p className="text-xs text-muted-foreground mt-0.5">⭐ {syn.rating}</p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => openInWaze(syn.lat, syn.lng)} className="text-xs px-2">
                Waze
              </Button>
              <Button size="sm" variant="outline" onClick={() => openInGoogleMaps(syn.lat, syn.lng)} className="text-xs px-2">
                Maps
              </Button>
            </div>
          </div>
        ))}

        {searched && synagogues.length > 0 && (
          <Button variant="ghost" onClick={findNearby} disabled={loading} className="w-full text-sm">
            חפש שוב
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
