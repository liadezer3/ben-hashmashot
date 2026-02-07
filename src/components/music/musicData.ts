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

export const SHABBAT_PLAYLISTS: Record<PlaylistKey, PlaylistData> = {
  'erev-shabbat': {
    name: 'ערב שבת',
    emoji: '🕯️',
    description: 'שירים להכנת השבת',
    youtube: [
      { id: 'SHYxBGf96HU', title: 'לכה דודי - יעקב שוואקי' },
      { id: '2xJWQPdG7jE', title: 'שלום עליכם - מרדכי בן דוד' },
      { id: 'J_UqEJ5gqVc', title: 'מה ידידות - עמירן דביר' },
      { id: 'N5YP8at2T-o', title: 'יה ריבון - יצחק מאיר' },
    ],
    spotify: [
      { uri: '37i9dQZF1DX0UrRvztWcAU', title: 'שירי שבת קלאסיים' },
      { uri: '37i9dQZF1DWWWgGVGF6Ony', title: 'Shabbat Shalom' },
    ]
  },
  'friday-night': {
    name: 'ליל שבת',
    emoji: '✨',
    description: 'ניגונים לסעודת ליל שבת',
    youtube: [
      { id: 'SHYxBGf96HU', title: 'לכה דודי - יעקב שוואקי' },
      { id: 'J_UqEJ5gqVc', title: 'מה ידידות - עמירן דביר' },
      { id: 'qPNfKyRnRxc', title: 'צור משלו - שלמה כהן' },
      { id: '2xJWQPdG7jE', title: 'שלום עליכם' },
    ],
    spotify: [
      { uri: '37i9dQZF1DWWWgGVGF6Ony', title: 'Shabbat Shalom' },
      { uri: '37i9dQZF1DX0UrRvztWcAU', title: 'שירי שבת - ליל שבת' },
    ]
  },
  'shabbat-morning': {
    name: 'בוקר שבת',
    emoji: '☀️',
    description: 'ניגונים לתפילה וסעודה שנייה',
    youtube: [
      { id: 'qPNfKyRnRxc', title: 'צור משלו - שלמה כהן' },
      { id: 'N5YP8at2T-o', title: 'יה ריבון - יצחק מאיר' },
      { id: 'J_UqEJ5gqVc', title: 'מה ידידות' },
      { id: 'SHYxBGf96HU', title: 'שבת שלום' },
    ],
    spotify: [
      { uri: '37i9dQZF1DWWWgGVGF6Ony', title: 'שבת שלום' },
      { uri: '37i9dQZF1DX0UrRvztWcAU', title: 'ניגוני שבת' },
    ]
  },
  'seuda-shlishit': {
    name: 'סעודה שלישית',
    emoji: '🌅',
    description: 'ניגונים לסעודה שלישית ונעילת שבת',
    youtube: [
      { id: 'N5YP8at2T-o', title: 'יה ריבון' },
      { id: 'qPNfKyRnRxc', title: 'צור משלו' },
      { id: 'J_UqEJ5gqVc', title: 'מה ידידות' },
      { id: 'SHYxBGf96HU', title: 'לכה דודי' },
    ],
    spotify: [
      { uri: '37i9dQZF1DX0UrRvztWcAU', title: 'ניגוני שבת' },
    ]
  },
  'havdalah': {
    name: 'מוצאי שבת',
    emoji: '🌙',
    description: 'שירי הבדלה ופתיחת שבוע',
    youtube: [
      { id: '2xJWQPdG7jE', title: 'אליהו הנביא' },
      { id: 'N5YP8at2T-o', title: 'שבוע טוב' },
      { id: 'SHYxBGf96HU', title: 'המבדיל' },
    ],
    spotify: [
      { uri: '37i9dQZF1DWWWgGVGF6Ony', title: 'שירי הבדלה' },
    ]
  },
  'weekday': {
    name: 'ימי חול',
    emoji: '📅',
    description: 'שירים לימות השבוע',
    youtube: [
      { id: 'SHYxBGf96HU', title: 'שירי שבת קלאסיים' },
      { id: '2xJWQPdG7jE', title: 'שלום עליכם' },
      { id: 'N5YP8at2T-o', title: 'יה ריבון' },
    ],
    spotify: [
      { uri: '37i9dQZF1DX0UrRvztWcAU', title: 'שירי שבת' },
      { uri: '37i9dQZF1DWWWgGVGF6Ony', title: 'Shabbat Shalom' },
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
