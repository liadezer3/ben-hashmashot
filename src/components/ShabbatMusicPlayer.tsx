import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, ListMusic, Sparkles } from "lucide-react";
import { useShabbatMode } from "@/hooks/useShabbatMode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SHABBAT_PLAYLISTS, getPlaylistForPhase, type PlaylistKey, type MusicPlatform } from "./music/musicData";
import YouTubePlayer from "./music/YouTubePlayer";
import SpotifyPlayer from "./music/SpotifyPlayer";

interface ShabbatMusicPlayerProps {
  candleLighting?: string;
  havdalah?: string;
}

const ShabbatMusicPlayer = ({ candleLighting, havdalah }: ShabbatMusicPlayerProps) => {
  const shabbatMode = useShabbatMode(candleLighting, havdalah);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistKey>('erev-shabbat');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [platform, setPlatform] = useState<MusicPlatform>('youtube');

  useEffect(() => {
    if (autoMode) {
      const suggestedPlaylist = getPlaylistForPhase(shabbatMode.phase);
      setSelectedPlaylist(suggestedPlaylist);
      setCurrentVideoIndex(0);
    }
  }, [shabbatMode.phase, autoMode]);

  const currentPlaylist = SHABBAT_PLAYLISTS[selectedPlaylist];
  const currentVideo = currentPlaylist.youtube[currentVideoIndex];

  const handleNext = () => {
    setCurrentVideoIndex((prev) =>
      prev < currentPlaylist.youtube.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrevious = () => {
    setCurrentVideoIndex((prev) =>
      prev > 0 ? prev - 1 : currentPlaylist.youtube.length - 1
    );
  };

  const handlePlaylistChange = (value: string) => {
    setSelectedPlaylist(value as PlaylistKey);
    setCurrentVideoIndex(0);
    setAutoMode(false);
  };

  const toggleAutoMode = () => {
    setAutoMode(!autoMode);
    if (!autoMode) {
      const suggestedPlaylist = getPlaylistForPhase(shabbatMode.phase);
      setSelectedPlaylist(suggestedPlaylist);
      setCurrentVideoIndex(0);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5" />
            נגן שירי שבת
          </CardTitle>
          <Button
            variant={autoMode ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoMode}
            className="gap-1"
          >
            <Sparkles className="w-4 h-4" />
            {autoMode ? "אוטומטי" : "ידני"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Platform toggle */}
        <Tabs value={platform} onValueChange={(v) => setPlatform(v as MusicPlatform)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="youtube" className="gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" className="fill-primary-foreground"/></svg>
              YouTube
            </TabsTrigger>
            <TabsTrigger value="spotify" className="gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Spotify
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Playlist selector */}
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedPlaylist} onValueChange={handlePlaylistChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SHABBAT_PLAYLISTS).map(([key, playlist]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span>{playlist.emoji}</span>
                    <span>{playlist.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current playlist info */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg">
            {currentPlaylist.emoji}
          </Badge>
          <div>
            <p className="font-medium">{currentPlaylist.name}</p>
            <p className="text-sm text-muted-foreground">{currentPlaylist.description}</p>
          </div>
        </div>

        {/* Platform-specific player */}
        {platform === 'youtube' ? (
          <YouTubePlayer
            video={currentVideo}
            isPlaying={isPlaying}
            isMuted={isMuted}
            currentIndex={currentVideoIndex}
            totalVideos={currentPlaylist.youtube.length}
            videos={currentPlaylist.youtube}
            onPlay={() => setIsPlaying(!isPlaying)}
            onMute={() => setIsMuted(!isMuted)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSelectTrack={setCurrentVideoIndex}
          />
        ) : (
          <SpotifyPlayer playlists={currentPlaylist.spotify} />
        )}
      </CardContent>
    </Card>
  );
};

export default ShabbatMusicPlayer;
