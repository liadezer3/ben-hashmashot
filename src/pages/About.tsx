import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Heart, Code, Mail, MessageCircle, Github, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:underline mb-6">
          <ArrowRight className="w-4 h-4" />
          חזרה לדף הבית
        </Link>

        <Card className="shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              אודות בין השמשות
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Logo / Hero */}
            <div className="text-center py-6">
              <div className="text-6xl mb-4">🕯️</div>
              <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-400">
                בין השמשות
              </h2>
              <p className="text-muted-foreground">
                תזכורות חכמות לכניסת השבת
              </p>
            </div>

            {/* Story */}
            <section>
              <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                הסיפור שלנו
              </h3>
              <div className="text-muted-foreground space-y-3">
                <p>
                  כמה פעמים קרה לכם שהסתכלתם על השעון ופתאום הבנתם שעוד כמה דקות נכנסת שבת?
                  הריצה המטורפת לסגור את הכל, הלחץ, התחושה שהשבת מתחילה בבלאגן במקום בשלווה...
                </p>
                <p>
                  <strong>בין השמשות</strong> נולדה מתוך הרצון הפשוט הזה — להיכנס לשבת ברוגע.
                  תזכורת קטנה בזמן הנכון יכולה לשנות את כל החוויה.
                </p>
                <p>
                  האפליקציה נבנתה באהבה עבור כל מי ששומר שבת — דתיים, מסורתיים, או כאלה שפשוט 
                  רוצים לדעת מתי השבת נכנסת. בלי להתקין כלום, בלי להירשם, בלי סיסמאות.
                  פשוט לפתוח ולהתחיל.
                </p>
              </div>
            </section>

            {/* Features */}
            <section>
              <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-3">
                מה אנחנו מציעים
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  זמני שבת וחגים מדויקים לפי המיקום שלך
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  תזכורות בוואטסאפ, טלגרם, מייל או Push
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  זמני תפילה יומיים
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  תוכן תורני — פרשת השבוע ודברי תורה
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  רשימת הכנות לשבת
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  מתכונים לשבת עם AI
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  ניהול אירועים משפחתיים וימי הולדת
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  <strong>הכל בחינם, בלי פרסומות!</strong>
                </li>
              </ul>
            </section>

            {/* Developer */}
            <section>
              <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                <Code className="w-5 h-5" />
                מי מאחורי הקלעים
              </h3>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                  ל
                </div>
                <div>
                  <h4 className="font-bold text-lg">ליעד עזר</h4>
                  <p className="text-sm text-muted-foreground">מפתח ויוצר האפליקציה</p>
                  <p className="text-sm text-muted-foreground">ירושלים, ישראל 🇮🇱</p>
                </div>
              </div>
            </section>

            {/* Tech */}
            <section>
              <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-3">
                טכנולוגיות
              </h3>
              <p className="text-muted-foreground mb-2">
                האפליקציה נבנתה עם הטכנולוגיות המתקדמות ביותר:
              </p>
              <div className="flex flex-wrap gap-2">
                {["React", "TypeScript", "Supabase", "Tailwind CSS", "Vercel", "PWA", "Hebcal API", "Sefaria API"].map((tech) => (
                  <span key={tech} className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </section>

            {/* Contact */}
            <section>
              <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-3">
                צור קשר
              </h3>
              <p className="text-muted-foreground mb-4">
                יש לך שאלה, רעיון לשיפור, או סתם רוצה להגיד תודה? נשמח לשמוע ממך!
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/972509151878"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  וואטסאפ
                </a>
                <a
                  href="mailto:liadezer3@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  liadezer3@gmail.com
                </a>
                <a
                  href="https://github.com/liadezer3/ben-hashmashot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </section>

            {/* Version */}
            <div className="text-center pt-4 border-t text-sm text-muted-foreground">
              <p>גרסה 1.0.0 • אוקטובר 2026</p>
              <p className="mt-1">נבנה באהבה בירושלים 🕯️</p>
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
