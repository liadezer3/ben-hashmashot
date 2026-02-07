import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
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
  return (
    <div className="space-y-4">
      {/* YouTube embed */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <iframe
          src={`https://www.youtube.com/embed/${video.id}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&enablejsapi=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
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
            key={v.id}
            onClick={() => onSelectTrack(index)}
            className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
              index === currentIndex
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
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
