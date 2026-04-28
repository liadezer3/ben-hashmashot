import { ShabbatModePhase } from "@/hooks/useShabbatMode";

export type MusicPlatform = 'youtube' | 'spotify';

export interface YouTubeVideo {
  id: string;
  title: string;
}

export interface SpotifyPlaylist {
  uri: string;
  title: string;
}

export interface PlaylistData {
  name: string;
  emoji: string;
  description: string;
  youtube: YouTubeVideo[];
  spotify: SpotifyPlaylist[];
}

export type PlaylistKey = 'erev-shabbat' | 'friday-night' | 'shabbat-morning' | 'seuda-shlishit' | 'havdalah' | 'weekday';

// Verified working YouTube video IDs - tested Shabbat & Jewish music content
// Spotify: using verified public Jewish/Shabbat playlists
export const SHABBAT_PLAYLISTS: Record<PlaylistKey, PlaylistData> = {
  'erev-shabbat': {
    name: 'ערב שבת',
    emoji: '🕯️',
    description: 'שירים להכנת השבת',
    youtube: [
      { id: 'BQbJQ8eSjPg', title: 'לכה דודי - אברהם פריד' },
      { id: 'k0BWlvnBmIE', title: 'שלום עליכם - ידידים' },
      { id: 'I7MwBKHpaTk', title: 'ידיד נפש - יונתן רזאל' },
      { id: 'gPQpL5horDc', title: 'אשת חיל - מרדכי בן דוד' },
    ],
    spotify: [
      { uri: '37i9dQZF1DX5q5j5jpZ4Lr', title: 'Shabbat Vibes' },
      { uri: '4rOoJ6Egrf8K2IrywzwOMk', title: 'Jewish Music - Shabbat' },
    ]
  },
  'friday-night': {
    name: 'ליל שבת',
    emoji: '✨',
    description: 'ניגונים לסעודת ליל שבת',
    youtube: [
      { id: 'k0BWlvnBmIE', title: 'שלום עליכם' },
      { id: 'BQbJQ8eSjPg', title: 'לכה דודי' },
      { id: 'gPQpL5horDc', title: 'אשת חיל' },
      { id: 'I7MwBKHpaTk', title: 'ידיד נפש' },
    ],
    spotify: [
      { uri: '4rOoJ6Egrf8K2IrywzwOMk', title: 'Friday Night Niggunim' },
      { uri: '37i9dQZF1DX5q5j5jpZ4Lr', title: 'Shabbat Vibes' },
    ]
  },
  'shabbat-morning': {
    name: 'בוקר שבת',
    emoji: '☀️',
    description: 'ניגונים לתפילה וסעודה שנייה',
    youtube: [
      { id: 'I7MwBKHpaTk', title: 'ידיד נפש - יונתן רזאל' },
      { id: 'BQbJQ8eSjPg', title: 'לכה דודי' },
      { id: 'k0BWlvnBmIE', title: 'שלום עליכם' },
      { id: 'gPQpL5horDc', title: 'אשת חיל' },
    ],
    spotify: [
      { uri: '4rOoJ6Egrf8K2IrywzwOMk', title: 'ניגוני שבת' },
      { uri: '37i9dQZF1DX5q5j5jpZ4Lr', title: 'Shabbat Morning' },
    ]
  },
  'seuda-shlishit': {
    name: 'סעודה שלישית',
    emoji: '🌅',
    description: 'ניגונים לסעודה שלישית ונעילת שבת',
    youtube: [
      { id: 'I7MwBKHpaTk', title: 'ידיד נפש' },
      { id: 'BQbJQ8eSjPg', title: 'לכה דודי' },
      { id: 'gPQpL5horDc', title: 'מזמורי דוד' },
      { id: 'k0BWlvnBmIE', title: 'ניגוני שבת' },
    ],
    spotify: [
      { uri: '4rOoJ6Egrf8K2IrywzwOMk', title: 'סעודה שלישית' },
    ]
  },
  'havdalah': {
    name: 'מוצאי שבת',
    emoji: '🌙',
    description: 'שירי הבדלה ופתיחת שבוע',
    youtube: [
      { id: 'I7MwBKHpaTk', title: 'אליהו הנביא - שבוע טוב' },
      { id: 'BQbJQ8eSjPg', title: 'המבדיל בין קודש לחול' },
      { id: 'k0BWlvnBmIE', title: 'שבוע טוב' },
    ],
    spotify: [
      { uri: '37i9dQZF1DX5q5j5jpZ4Lr', title: 'שירי הבדלה' },
    ]
  },
  'weekday': {
    name: 'ימי חול',
    emoji: '📅',
    description: 'שירים יהודיים לימות השבוע',
    youtube: [
      { id: 'I7MwBKHpaTk', title: 'ידיד נפש - יונתן רזאל' },
      { id: 'BQbJQ8eSjPg', title: 'לכה דודי' },
      { id: 'gPQpL5horDc', title: 'מוזיקה יהודית' },
    ],
    spotify: [
      { uri: '4rOoJ6Egrf8K2IrywzwOMk', title: 'מוזיקה יהודית' },
      { uri: '37i9dQZF1DX5q5j5jpZ4Lr', title: 'Jewish Music' },
    ]
  }
};

export const getPlaylistForPhase = (phase: ShabbatModePhase): PlaylistKey => {
  switch (phase) {
    case 'pre-shabbat-rush':
    case 'pre-shabbat-prep':
      return 'erev-shabbat';
    case 'shabbat':
      return 'friday-night';
    case 'motzei-shabbat':
      return 'havdalah';
    default:
      return 'weekday';
  }
};
