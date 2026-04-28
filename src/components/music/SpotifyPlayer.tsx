import { useState } from "react";
import { SpotifyPlaylist } from "./musicData";
import { Badge } from "@/components/ui/badge";

interface SpotifyPlayerProps {
  playlists: SpotifyPlaylist[];
  customPlaylist?: { uri: string; name: string } | null;
}

const SpotifyPlayer = ({ playlists, customPlaylist }: SpotifyPlayerProps) => {
  const allPlaylists = customPlaylist
    ? [{ uri: customPlaylist.uri, title: `⭐ ${customPlaylist.name}` }, ...playlists]
    : playlists;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentPlaylist = allPlaylists[selectedIndex];

  if (!currentPlaylist) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>אין פלייליסטים זמינים לשלב זה</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Spotify embed - using search for reliable Shabbat content */}
      <div className="rounded-lg overflow-hidden">
        <iframe
          src={`https://open.spotify.com/embed/playlist/${currentPlaylist.uri}?utm_source=generator&theme=0`}
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg border-0"
          title={currentPlaylist.title}
          onError={() => console.warn('Spotify playlist unavailable')}
        />
      </div>

      {/* Playlist selector */}
      {allPlaylists.length > 1 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">פלייליסטים זמינים:</p>
          {allPlaylists.map((pl, index) => (
            <button
              key={`${pl.uri}-${index}`}
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

      {/* Direct search link as fallback */}
      <a
        href={`https://open.spotify.com/search/${encodeURIComponent('שירי שבת')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-sm text-primary hover:underline"
      >
        🔍 חפש עוד שירי שבת ב-Spotify
      </a>

      <p className="text-xs text-center text-muted-foreground">
        אם הפלייליסט לא נטען, פתח באפליקציית Spotify
      </p>
    </div>
  );
};

export default SpotifyPlayer;
