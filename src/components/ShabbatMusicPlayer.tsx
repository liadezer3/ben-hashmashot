import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2,
  VolumeX,
  ListMusic,
  Sparkles
} from "lucide-react";
import { useShabbatMode, ShabbatModePhase } from "@/hooks/useShabbatMode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// YouTube playlists organized by Shabbat phase
const SHABBAT_PLAYLISTS = {
  'erev-shabbat': {
    name: 'ערב שבת',
    emoji: '🕯️',
    description: 'שירים להכנת השבת',
    videos: [
      { id: 'SHYxBGf96HU', title: 'לכה דודי - יעקב שוואקי' },
      { id: '2xJWQPdG7jE', title: 'שלום עליכם - מרדכי בן דוד' },
      { id: 'J_UqEJ5gqVc', title: 'מה ידידות - עמירן דביר' },
      { id: 'N5YP8at2T-o', title: 'יה ריבון - יצחק מאיר' },
    ]
  },
  'friday-night': {
    name: 'ליל שבת',
    emoji: '✨',
    description: 'ניגונים לסעודת ליל שבת',
    videos: [
      { id: 'SHYxBGf96HU', title: 'לכה דודי - יעקב שוואקי' },
      { id: 'J_UqEJ5gqVc', title: 'מה ידידות - עמירן דביר' },
      { id: 'qPNfKyRnRxc', title: 'צור משלו - שלמה כהן' },
      { id: '2xJWQPdG7jE', title: 'שלום עליכם' },
    ]
  },
  'shabbat-morning': {
    name: 'בוקר שבת',
    emoji: '☀️',
    description: 'ניגונים לתפילה וסעודה שנייה',
    videos: [
      { id: 'qPNfKyRnRxc', title: 'צור משלו - שלמה כהן' },
      { id: 'N5YP8at2T-o', title: 'יה ריבון - יצחק מאיר' },
      { id: 'J_UqEJ5gqVc', title: 'מה ידידות' },
      { id: 'SHYxBGf96HU', title: 'שבת שלום' },
    ]
  },
  'seuda-shlishit': {
    name: 'סעודה שלישית',
    emoji: '🌅',
    description: 'ניגונים לסעודה שלישית ונעילת שבת',
    videos: [
      { id: 'N5YP8at2T-o', title: 'יה ריבון' },
      { id: 'qPNfKyRnRxc', title: 'צור משלו' },
      { id: 'J_UqEJ5gqVc', title: 'מה ידידות' },
      { id: 'SHYxBGf96HU', title: 'לכה דודי' },
    ]
  },
  'havdalah': {
    name: 'מוצאי שבת',
    emoji: '🌙',
    description: 'שירי הבדלה ופתיחת שבוע',
    videos: [
      { id: '2xJWQPdG7jE', title: 'אליהו הנביא' },
      { id: 'N5YP8at2T-o', title: 'שבוע טוב' },
      { id: 'SHYxBGf96HU', title: 'המבדיל' },
    ]
  },
  'weekday': {
    name: 'ימי חול',
    emoji: '📅',
    description: 'שירים לימות השבוע',
    videos: [
      { id: 'SHYxBGf96HU', title: 'שירי שבת קלאסיים' },
      { id: '2xJWQPdG7jE', title: 'שלום עליכם' },
      { id: 'N5YP8at2T-o', title: 'יה ריבון' },
    ]
  }
};

// Map ShabbatModePhase to playlist keys
const getPlaylistForPhase = (phase: ShabbatModePhase): keyof typeof SHABBAT_PLAYLISTS => {
  switch (phase) {
    case 'pre-shabbat-rush':
    case 'pre-shabbat-prep':
      return 'erev-shabbat';
    case 'shabbat':
      // Could be more specific based on time of day
      return 'friday-night';
    case 'motzei-shabbat':
      return 'havdalah';
    default:
      return 'weekday';
  }
};

interface ShabbatMusicPlayerProps {
  candleLighting?: string;
  havdalah?: string;
}

const ShabbatMusicPlayer = ({ candleLighting, havdalah }: ShabbatMusicPlayerProps) => {
  const shabbatMode = useShabbatMode(candleLighting, havdalah);
  const [selectedPlaylist, setSelectedPlaylist] = useState<keyof typeof SHABBAT_PLAYLISTS>('erev-shabbat');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoMode, setAutoMode] = useState(true);

  // Update playlist based on Shabbat phase when auto mode is on
  useEffect(() => {
    if (autoMode) {
      const suggestedPlaylist = getPlaylistForPhase(shabbatMode.phase);
      setSelectedPlaylist(suggestedPlaylist);
      setCurrentVideoIndex(0);
    }
  }, [shabbatMode.phase, autoMode]);

  const currentPlaylist = SHABBAT_PLAYLISTS[selectedPlaylist];
  const currentVideo = currentPlaylist.videos[currentVideoIndex];

  const handleNext = () => {
    setCurrentVideoIndex((prev) => 
      prev < currentPlaylist.videos.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrevious = () => {
    setCurrentVideoIndex((prev) => 
      prev > 0 ? prev - 1 : currentPlaylist.videos.length - 1
    );
  };

  const handlePlaylistChange = (value: string) => {
    setSelectedPlaylist(value as keyof typeof SHABBAT_PLAYLISTS);
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

        {/* YouTube embed */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&enablejsapi=1`}
            title={currentVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* Current track info */}
        <div className="text-center">
          <p className="font-medium">{currentVideo.title}</p>
          <p className="text-sm text-muted-foreground">
            {currentVideoIndex + 1} מתוך {currentPlaylist.videos.length}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-12 w-12"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Track list */}
        <div className="space-y-1 max-h-40 overflow-y-auto">
          <p className="text-sm font-medium text-muted-foreground mb-2">רשימת שירים:</p>
          {currentPlaylist.videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
                index === currentVideoIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              {index + 1}. {video.title}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShabbatMusicPlayer;
