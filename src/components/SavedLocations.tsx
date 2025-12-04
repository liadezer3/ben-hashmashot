import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2, Star, Navigation, Loader2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { detectUserCity, isGeolocationSupported } from "@/lib/geoLocation";

interface SavedLocation {
  id: string;
  city: string;
  is_primary: boolean;
}

export const SavedLocations = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [newCity, setNewCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const { toast } = useToast();

  const detectLocation = async () => {
    if (!isGeolocationSupported()) {
      toast({
        title: "לא נתמך",
        description: "הדפדפן שלך לא תומך בזיהוי מיקום",
        variant: "destructive",
      });
      return;
    }

    setDetecting(true);
    try {
      const city = await detectUserCity();
      setNewCity(city);
      toast({
        title: "מיקום זוהה!",
        description: `זוהית ב${city}`,
      });
    } catch (error) {
      console.error("Error detecting location:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לזהות את המיקום. נסה לאשר גישה למיקום",
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;

      setLocations(data || []);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async () => {
    if (!newCity.trim()) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("saved_locations")
        .insert({
          user_id: user.id,
          city: newCity,
          is_primary: locations.length === 0
        });

      if (error) throw error;

      setNewCity("");
      loadLocations();

      toast({
        title: "הצלחה!",
        description: "המיקום נוסף בהצלחה",
      });
    } catch (error) {
      console.error("Error adding location:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להוסיף את המיקום",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      loadLocations();

      toast({
        title: "הצלחה!",
        description: "המיקום נמחק",
      });
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו למחוק את המיקום",
        variant: "destructive",
      });
    }
  };

  const setPrimary = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Reset all to non-primary
      await supabase
        .from("saved_locations")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      // Set selected as primary
      const { error } = await supabase
        .from("saved_locations")
        .update({ is_primary: true })
        .eq("id", id);

      if (error) throw error;

      loadLocations();

      toast({
        title: "הצלחה!",
        description: "המיקום הוגדר כראשי",
      });
    } catch (error) {
      console.error("Error setting primary:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להגדיר את המיקום כראשי",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-fade-in">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">מיקומים שמורים</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          placeholder="הוסף עיר חדשה"
          onKeyPress={(e) => e.key === "Enter" && addLocation()}
        />
        <Button 
          variant="outline" 
          onClick={detectLocation} 
          disabled={detecting}
          title="זהה מיקום אוטומטית"
        >
          {detecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </Button>
        <Button onClick={addLocation} disabled={saving}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {locations.map((location) => (
          <div
            key={location.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {location.is_primary && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
              <span className="font-medium">{location.city}</span>
            </div>
            
            <div className="flex gap-2">
              {!location.is_primary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPrimary(location.id)}
                >
                  הגדר כראשי
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteLocation(location.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            טרם נוספו מיקומים
          </p>
        )}
      </div>
    </Card>
  );
};
