import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ExternalLink, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { YouTubeVideo } from "./musicData";

interface YouTubePlayerProps {
  video: YouTubeVideo;
  isPlaying: boolean;
  isMuted: boolean;
  currentIndex: number;
  totalVideos: number;
  videos: YouTubeVideo[];
  onPlay: () => void;
  onMute: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSelectTrack: (index: number) => void;
}

// Verified Jewish/Shabbat music YouTube playlist (public, long-running)
const FALLBACK_PLAYLIST_ID = "PLrAl9pMvgQ4qB1KGHmHHjNzKpRz0qz8Vp";

const YouTubePlayer = ({
  video,
  isPlaying,
  isMuted,
  currentIndex,
  totalVideos,
  videos,
  onPlay,
  onMute,
  onNext,
  onPrevious,
  onSelectTrack,
}: YouTubePlayerProps) => {
  const [audioOnly, setAudioOnly] = useState(false);

  const searchQuery = encodeURIComponent(video.title + " ניגון שבת");
  // Use search-based embed; works without depending on a single video ID
  const embedSrc = `https://www.youtube.com/embed?listType=search&list=${searchQuery}&autoplay=${
    isPlaying ? 1 : 0
  }&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1`;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

  return (
    <div className="space-y-4">
      {/* Player area */}
      {audioOnly ? (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center">
          <div className="text-6xl mb-3 animate-pulse">🎵</div>
          <p className="font-medium text-center px-4">{video.title}</p>
          <p className="text-xs text-muted-foreground mt-2">מצב אודיו בלבד</p>
          {/* Hidden iframe for audio playback */}
          <iframe
            src={embedSrc}
            title={video.title}
            allow="autoplay; encrypted-media"
            className="absolute opacity-0 pointer-events-none w-1 h-1"
          />
        </div>
      ) : (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            key={video.title}
            src={embedSrc}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAudioOnly(!audioOnly)}
          className="gap-1"
        >
          {audioOnly ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {audioOnly ? "הצג וידאו" : "אודיו בלבד"}
        </Button>
        <a
          href={youtubeSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="w-3 h-3" />
          חפש ב-YouTube
        </a>
      </div>

      {/* Current track info */}
      <div className="text-center">
        <p className="font-medium">{video.title}</p>
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} מתוך {totalVideos}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon" onClick={onMute}>
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={onPrevious}>
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button variant="default" size="icon" onClick={onPlay} className="h-12 w-12">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button variant="outline" size="icon" onClick={onNext}>
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Track list */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        <p className="text-sm font-medium text-muted-foreground mb-2">רשימת שירים:</p>
        {videos.map((v, index) => (
          <button
            key={`${v.id}-${index}`}
            onClick={() => onSelectTrack(index)}
            className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
              index === currentIndex
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {index + 1}. {v.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default YouTubePlayer;
