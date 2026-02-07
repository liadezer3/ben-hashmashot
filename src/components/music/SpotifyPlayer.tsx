import { useState } from "react";
import { SpotifyPlaylist } from "./musicData";

interface SpotifyPlayerProps {
  playlists: SpotifyPlaylist[];
}

const SpotifyPlayer = ({ playlists }: SpotifyPlayerProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentPlaylist = playlists[selectedIndex];

  if (!currentPlaylist) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>אין פלייליסטים זמינים לשלב זה</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Spotify embed */}
      <div className="rounded-lg overflow-hidden">
        <iframe
          src={`https://open.spotify.com/embed/playlist/${currentPlaylist.uri}?utm_source=generator&theme=0`}
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg border-0"
          title={currentPlaylist.title}
        />
      </div>

      {/* Playlist selector */}
      {playlists.length > 1 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">פלייליסטים זמינים:</p>
          {playlists.map((pl, index) => (
            <button
              key={pl.uri}
              onClick={() => setSelectedIndex(index)}
              className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              🎵 {pl.title}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        הנגן משתמש ב-Spotify Embed. לחוויה מלאה, פתח באפליקציית Spotify.
      </p>
    </div>
  );
};

export default SpotifyPlayer;
