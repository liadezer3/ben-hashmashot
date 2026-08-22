// Voice command intent engine — maps free-form Hebrew/English speech to app actions.

export type VoiceIntent =
  | { type: "navigate"; path: string; say: string }
  | { type: "shabbat-times"; kind: "candles" | "havdalah" | "both" }
  | { type: "parsha" }
  | { type: "halachic-times" }
  | { type: "theme"; mode: "dark" | "light" | "toggle" }
  | { type: "music" }
  | { type: "scroll"; direction: "top" | "bottom" }
  | { type: "help" }
  | { type: "stop" }
  | { type: "unknown"; transcript: string };

interface Rule {
  patterns: string[];
  intent: VoiceIntent;
}

const rules: Rule[] = [
  // Stop / cancel
  { patterns: ["תפסיק", "שקט", "די", "עצור", "stop", "quiet", "silence"], intent: { type: "stop" } },

  // Help
  {
    patterns: ["מה אתה יודע", "עזרה", "מה אפשר", "פקודות", "help", "what can you do"],
    intent: { type: "help" },
  },

  // Theme
  { patterns: ["מצב כהה", "מסך כהה", "עבור לכהה", "חשוך", "dark mode", "dark"], intent: { type: "theme", mode: "dark" } },
  { patterns: ["מצב בהיר", "מסך בהיר", "אור", "light mode", "light"], intent: { type: "theme", mode: "light" } },
  { patterns: ["שנה עיצוב", "החלף מצב", "שנה מצב", "אורח דינמי", "toggle theme"], intent: { type: "theme", mode: "toggle" } },

  // Times
  { patterns: ["הדלקת נרות", "כניסת שבת", "מתי שבת נכנסת", "candle lighting", "shabbat start"], intent: { type: "shabbat-times", kind: "candles" } },
  { patterns: ["הבדלה", "יציאת שבת", "מתי שבת יוצאת", "צאת שבת", "havdalah", "shabbat end"], intent: { type: "shabbat-times", kind: "havdalah" } },
  { patterns: ["זמני שבת", "זמנים של שבת", "shabbat times"], intent: { type: "shabbat-times", kind: "both" } },
  { patterns: ["זמני הלכה", "זמנים הלכתיים", "סוף זמן קריאת שמע", "חצות", "זריחה", "שקיעה", "zmanim", "halachic times"], intent: { type: "halachic-times" } },
  { patterns: ["פרשת השבוע", "פרשה", "parsha", "torah portion"], intent: { type: "parsha" } },

  // Music
  { patterns: ["מוזיקה", "שירים", "נגן", "פלייליסט", "music", "play music", "songs"], intent: { type: "music" } },

  // Navigation
  { patterns: ["דף הבית", "מסך ראשי", "עמוד ראשי", "חזור הבית", "home", "main screen"], intent: { type: "navigate", path: "/", say: "עובר לדף הבית" } },
  { patterns: ["לוח בקרה", "דשבורד", "סטטיסטיקות", "תובנות", "dashboard", "insights"], intent: { type: "navigate", path: "/dashboard", say: "פותח את לוח הבקרה" } },
  { patterns: ["הגדרות", "settings"], intent: { type: "navigate", path: "/settings", say: "פותח הגדרות" } },
  { patterns: ["התראות", "notifications"], intent: { type: "navigate", path: "/settings?tab=notifications", say: "פותח את מסך ההתראות" } },
  { patterns: ["מקומות", "עיר", "מיקום", "locations", "city"], intent: { type: "navigate", path: "/settings?tab=locations", say: "פותח את מסך המקומות" } },
  { patterns: ["משפחה", "קבוצה משפחתית", "family"], intent: { type: "navigate", path: "/settings?tab=family", say: "פותח את מסך המשפחה" } },
  { patterns: ["בית חכם", "תאורה", "smart home", "lights"], intent: { type: "navigate", path: "/settings?tab=smart-home", say: "פותח את הבית החכם" } },
  { patterns: ["תורה", "לימוד", "דף יומי", "torah"], intent: { type: "navigate", path: "/settings?tab=torah", say: "פותח את תוכן התורה" } },
  { patterns: ["רשימת קניות", "קניות", "shopping"], intent: { type: "navigate", path: "/settings?tab=family", say: "פותח את רשימת הקניות המשפחתית" } },
  { patterns: ["מתכונים", "recipes"], intent: { type: "navigate", path: "/settings?tab=recipes", say: "פותח מתכונים" } },
  { patterns: ["זכרונות", "תמונות", "memories"], intent: { type: "navigate", path: "/settings?tab=memories", say: "פותח זכרונות משפחתיים" } },
  { patterns: ["קהילה", "פיד", "community"], intent: { type: "navigate", path: "/settings?tab=community", say: "פותח את הקהילה" } },
  { patterns: ["דירוג", "מדד שבת", "rating"], intent: { type: "navigate", path: "/settings?tab=rating", say: "פותח את מדד השבת" } },
  { patterns: ["הזמנות", "אורחים", "invitations", "guests"], intent: { type: "navigate", path: "/settings?tab=invitations", say: "פותח הזמנות ואורחים" } },
  { patterns: ["ספירת העומר", "עומר", "omer"], intent: { type: "navigate", path: "/settings?tab=omer", say: "פותח את ספירת העומר" } },
  { patterns: ["נרות", "מעקב נרות", "candles tracker"], intent: { type: "navigate", path: "/settings?tab=candles", say: "פותח את מעקב הדלקת הנרות" } },
  { patterns: ["ימי הולדת", "אזכרות", "יומן משפחתי", "family events"], intent: { type: "navigate", path: "/settings?tab=family-events", say: "פותח את היומן המשפחתי" } },
  { patterns: ["פרופיל", "profile"], intent: { type: "navigate", path: "/profile", say: "פותח את הפרופיל" } },
  { patterns: ["ווידג'ט", "וידגט", "widget"], intent: { type: "navigate", path: "/widget", say: "פותח את הווידג'ט" } },
  { patterns: ["פרטיות", "privacy"], intent: { type: "navigate", path: "/privacy", say: "פותח את מדיניות הפרטיות" } },
  { patterns: ["תקנון", "תנאי שימוש", "terms"], intent: { type: "navigate", path: "/terms", say: "פותח את תנאי השימוש" } },

  // Scrolling
  { patterns: ["גלול למעלה", "למעלה", "scroll up", "top"], intent: { type: "scroll", direction: "top" } },
  { patterns: ["גלול למטה", "למטה", "scroll down", "bottom"], intent: { type: "scroll", direction: "bottom" } },
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[?!.,'"״׳]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const parseVoiceCommand = (raw: string): VoiceIntent => {
  const text = normalize(raw);
  if (!text) return { type: "unknown", transcript: raw };

  let best: { intent: VoiceIntent; score: number } | null = null;

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      const p = normalize(pattern);
      if (text.includes(p)) {
        const score = p.length;
        if (!best || score > best.score) best = { intent: rule.intent, score };
      }
    }
  }

  return best ? best.intent : { type: "unknown", transcript: raw };
};

export const VOICE_HELP_TEXT = [
  "אפשר לבקש ממני:",
  "• ניווט: \"פתח לוח בקרה\", \"הגדרות\", \"התראות\", \"משפחה\", \"בית חכם\", \"פרופיל\"",
  "• זמנים: \"מתי הדלקת נרות\", \"יציאת שבת\", \"זמני הלכה\", \"פרשת השבוע\"",
  "• עיצוב: \"מצב כהה\", \"מצב בהיר\", \"שנה מצב\"",
  "• מוזיקה: \"נגן מוזיקה לשבת\"",
  "• גלילה: \"גלול למטה\" / \"גלול למעלה\"",
].join("\n");
