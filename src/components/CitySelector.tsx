import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { SUPPORTED_CITIES, findNearestCity } from "@/lib/cities";
import { useToast } from "@/hooks/use-toast";

interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  showGpsButton?: boolean;
}

export const CitySelector = ({ 
  value, 
  onChange, 
  label = "עיר",
  showGpsButton = true 
}: CitySelectorProps) => {
  const [detecting, setDetecting] = useState(false);
  const { toast } = useToast();

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "שגיאה",
        description: "הדפדפן שלך לא תומך בזיהוי מיקום",
        variant: "destructive",
      });
      return;
    }

    setDetecting(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;
      const nearestCity = findNearestCity(latitude, longitude);
      
      onChange(nearestCity.name);
      
      toast({
        title: "✅ המיקום זוהה",
        description: `העיר הקרובה אליך: ${nearestCity.hebrewName}`,
      });
    } catch (error: any) {
      console.error("Geolocation error:", error);
      let message = "לא הצלחנו לזהות את המיקום שלך";
      
      if (error.code === 1) {
        message = "יש לאפשר גישה למיקום בדפדפן";
      } else if (error.code === 2) {
        message = "לא ניתן לקבוע את המיקום כרגע";
      } else if (error.code === 3) {
        message = "הזמן לזיהוי המיקום פג";
      }

      toast({
        title: "שגיאה בזיהוי מיקום",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  // Find the current city for display
  const currentCity = SUPPORTED_CITIES.find(
    c => c.name === value || c.hebrewName === value
  );

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Select
          value={currentCity?.name || value}
          onValueChange={onChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="בחר עיר">
              {currentCity ? (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {currentCity.hebrewName}
                </span>
              ) : (
                "בחר עיר"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CITIES.map((city) => (
              <SelectItem key={city.geoId} value={city.name}>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {city.hebrewName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showGpsButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDetectLocation}
            disabled={detecting}
            title="זהה מיקום אוטומטית"
          >
            {detecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
