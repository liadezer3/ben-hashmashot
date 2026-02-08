import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2, Music, ExternalLink } from "lucide-react";
import { SHABBAT_PLAYLISTS, type PlaylistKey } from "./musicData";

interface CustomPlaylist {
  id: string;
  phase_key: string;
  spotify_uri: string;
  playlist_name: string;
}

interface CustomPlaylistManagerProps {
  userId: string;
  onPlaylistsChange?: () => void;
}

const PHASE_KEYS: PlaylistKey[] = [
  "erev-shabbat",
  "friday-night",
  "shabbat-morning",
  "seuda-shlishit",
  "havdalah",
  "weekday",
];

const extractSpotifyId = (input: string): string | null => {
  // Handle full URL: https://open.spotify.com/playlist/37i9dQZF1DX0UrRvztWcAU
  const urlMatch = input.match(/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Handle spotify URI: spotify:playlist:37i9dQZF1DX0UrRvztWcAU
  const uriMatch = input.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // Handle plain ID
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return input.trim();

  return null;
};

const CustomPlaylistManager = ({ userId, onPlaylistsChange }: CustomPlaylistManagerProps) => {
  const [customPlaylists, setCustomPlaylists] = useState<Record<string, CustomPlaylist>>({});
  const [inputs, setInputs] = useState<Record<string, { uri: string; name: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomPlaylists();
  }, [userId]);

  const fetchCustomPlaylists = async () => {
    const { data, error } = await supabase
      .from("custom_playlists")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      const map: Record<string, CustomPlaylist> = {};
      const inputMap: Record<string, { uri: string; name: string }> = {};
      data.forEach((p) => {
        map[p.phase_key] = p;
        inputMap[p.phase_key] = { uri: p.spotify_uri, name: p.playlist_name };
      });
      setCustomPlaylists(map);
      setInputs((prev) => ({ ...prev, ...inputMap }));
    }
  };

  const handleSave = async (phaseKey: string) => {
    const input = inputs[phaseKey];
    if (!input?.uri) {
      toast({ title: "שגיאה", description: "יש להזין URI או קישור של Spotify", variant: "destructive" });
      return;
    }

    const spotifyId = extractSpotifyId(input.uri);
    if (!spotifyId) {
      toast({
        title: "קישור לא תקין",
        description: "הזן קישור Spotify תקין, URI או מזהה פלייליסט",
        variant: "destructive",
      });
      return;
    }

    setSaving(phaseKey);
    const existing = customPlaylists[phaseKey];

    if (existing) {
      const { error } = await supabase
        .from("custom_playlists")
        .update({
          spotify_uri: spotifyId,
          playlist_name: input.name || "הפלייליסט שלי",
        })
        .eq("id", existing.id);

      if (error) {
        toast({ title: "שגיאה", description: "לא ניתן לעדכן", variant: "destructive" });
      } else {
        toast({ title: "עודכן!", description: `הפלייליסט עודכן ל${SHABBAT_PLAYLISTS[phaseKey as PlaylistKey].name}` });
        fetchCustomPlaylists();
        onPlaylistsChange?.();
      }
    } else {
      const { error } = await supabase.from("custom_playlists").insert({
        user_id: userId,
        phase_key: phaseKey,
        spotify_uri: spotifyId,
        playlist_name: input.name || "הפלייליסט שלי",
      });

      if (error) {
        toast({ title: "שגיאה", description: "לא ניתן לשמור", variant: "destructive" });
      } else {
        toast({ title: "נשמר!", description: `פלייליסט אישי נוסף ל${SHABBAT_PLAYLISTS[phaseKey as PlaylistKey].name}` });
        fetchCustomPlaylists();
        onPlaylistsChange?.();
      }
    }
    setSaving(null);
  };

  const handleDelete = async (phaseKey: string) => {
    const existing = customPlaylists[phaseKey];
    if (!existing) return;

    const { error } = await supabase.from("custom_playlists").delete().eq("id", existing.id);

    if (!error) {
      toast({ title: "נמחק", description: "הפלייליסט האישי הוסר" });
      setInputs((prev) => {
        const copy = { ...prev };
        delete copy[phaseKey];
        return copy;
      });
      fetchCustomPlaylists();
      onPlaylistsChange?.();
    }
  };

  const updateInput = (phaseKey: string, field: "uri" | "name", value: string) => {
    setInputs((prev) => ({
      ...prev,
      [phaseKey]: { ...prev[phaseKey], [field]: value },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="w-5 h-5" />
          פלייליסטים אישיים - Spotify
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          הזן קישור או URI של פלייליסט Spotify לכל שלב בשבת
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {PHASE_KEYS.map((phaseKey) => {
          const playlist = SHABBAT_PLAYLISTS[phaseKey];
          const hasCustom = !!customPlaylists[phaseKey];
          const inputVal = inputs[phaseKey] || { uri: "", name: "" };

          return (
            <div key={phaseKey} className="space-y-2 p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{playlist.emoji}</span>
                  <span className="font-medium text-sm">{playlist.name}</span>
                </div>
                {hasCustom && (
                  <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                    אישי ✓
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">שם הפלייליסט</Label>
                  <Input
                    placeholder="למשל: שירי השבת שלי"
                    value={inputVal.name}
                    onChange={(e) => updateInput(phaseKey, "name", e.target.value)}
                    className="h-8 text-sm"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    קישור / URI של Spotify
                  </Label>
                  <Input
                    placeholder="https://open.spotify.com/playlist/... או spotify:playlist:..."
                    value={inputVal.uri}
                    onChange={(e) => updateInput(phaseKey, "uri", e.target.value)}
                    className="h-8 text-sm font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(phaseKey)}
                  disabled={saving === phaseKey || !inputVal.uri}
                  className="gap-1 flex-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  {hasCustom ? "עדכן" : "שמור"}
                </Button>
                {hasCustom && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(phaseKey)}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            איך למצוא URI של פלייליסט?
          </p>
          <p>פתח את Spotify → לחץ על ⋯ ליד הפלייליסט → שתף → העתק קישור</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomPlaylistManager;
