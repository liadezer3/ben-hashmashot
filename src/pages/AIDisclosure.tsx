import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Bot, UtensilsCrossed, BookOpen, MessageSquare, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const AI_FEATURES = [
  {
    icon: UtensilsCrossed,
    title: "מתכונים לשבת",
    description: "AI יוצר הצעות למתכונים מותאמים לפי מספר אורחים, העדפות תזונה וסוג הארוחה.",
    example: "\"הצע מתכונים לסעודת ליל שבת ל-8 אנשים, ללא גלוטן\"",
  },
  {
    icon: BookOpen,
    title: "דברי תורה",
    description: "AI מסייע ביצירת דברי תורה לפרשת השבוע, עם אפשרות להתאמה לסגנון (לילדים, עסקי, לשולחן שבת).",
    example: "\"צור דבר תורה קצר לפרשת לך-לך לילדים\"",
  },
  {
    icon: MessageSquare,
    title: "ברכות לימי הולדת",
    description: "AI עוזר לנסח ברכות אישיות לאירועים משפחתיים — ימי הולדת, יום נישואין, בר/בת מצווה.",
    example: "\"כתוב ברכה חמה ליום הולדת 70 של סבתא\"",
  },
  {
    icon: Bot,
    title: "קונסיירז' ערב שבת",
    description: "AI בונה לו\"ז מותאם אישית להכנות לשבת, על בסיס המשימות שלך והזמן שנותר.",
    example: "\"צריך לקנות, לבשל ולנקות — תעזור לי לתכנן את הבוקר\"",
  },
];

export default function AIDisclosure() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:underline mb-6">
          <ArrowRight className="w-4 h-4" />
          חזרה לדף הבית
        </Link>

        <Card className="shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              שימוש בבינה מלאכותית באפליקציה
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Intro */}
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🤖</div>
              <p className="text-lg text-muted-foreground">
                אפליקציית "בין השמשות" משתמשת בבינה מלאכותית (AI) 
                <br />
                כדי לעזור לך להתכונן לשבת בצורה חכמה יותר.
              </p>
            </div>

            {/* AI Features */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                איפה משתמשים ב-AI?
              </h3>
              
              {AI_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-xl border bg-white dark:bg-gray-800 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                        {feature.title}
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">
                          AI
                        </span>
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {feature.description}
                      </p>
                      <div className="text-xs bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 p-2 rounded-lg italic">
                        דוגמה: {feature.example}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Important Notice */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-2">
                    חשוב לדעת
                  </h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>התכנים נוצרים אוטומטית ועשויים להכיל אי-דיוקים</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span><strong>לעניינים הלכתיים</strong> — יש להתייעץ עם רב מוסמך</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>אנחנו לא שומרים את השיחות עם ה-AI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>ה-AI לא יכול לגשת למידע אישי שלך ללא הרשאה מפורשת</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tech Info */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                מידע טכני
              </h4>
              <p className="text-sm text-muted-foreground">
                אנחנו משתמשים במודלי AI מתקדמים (כגון Gemini) דרך שירותי ענן מאובטחים.
                הנתונים מועברים בהצפנה מלאה (HTTPS) ואינם נשמרים לאחר השימוש.
              </p>
            </div>

            {/* Contact */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                יש לך שאלות על השימוש ב-AI?
                <br />
                <a href="mailto:liadezer3@gmail.com" className="text-amber-600 hover:underline">
                  צור קשר
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="text-center text-sm text-muted-foreground space-x-4 space-x-reverse">
          <Link to="/privacy" className="hover:underline">מדיניות פרטיות</Link>
          <span>•</span>
          <Link to="/terms" className="hover:underline">תנאי שימוש</Link>
          <span>•</span>
          <Link to="/help" className="hover:underline">עזרה</Link>
        </div>
      </div>
    </div>
  );
}
