import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:underline mb-6">
          <ArrowRight className="w-4 h-4" />
          חזרה לדף הבית
        </Link>
        
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl">מדיניות פרטיות</CardTitle>
            <p className="text-amber-100">עודכן לאחרונה: אוקטובר 2026</p>
          </CardHeader>
          
          <CardContent className="prose prose-amber dark:prose-invert max-w-none p-6 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">1. מבוא</h2>
              <p>
                אפליקציית "בין השמשות" ("האפליקציה", "אנחנו") מכבדת את פרטיות המשתמשים שלה.
                מדיניות פרטיות זו מסבירה אילו מידע אנחנו אוספים, כיצד אנחנו משתמשים בו,
                ומה הזכויות שלכם בנוגע למידע זה.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">2. המידע שאנחנו אוספים</h2>
              
              <h3 className="text-lg font-semibold mt-4">מידע שאתם מספקים לנו:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>כתובת אימייל (אם בחרתם להתחבר עם Google או להזין ידנית)</li>
                <li>מספר טלפון (אם בחרתם לקבל הודעות WhatsApp או SMS)</li>
                <li>מיקום גיאוגרפי (עיר/כתובת לחישוב זמני שבת)</li>
                <li>העדפות התראות (זמנים, ערוצים, תדירות)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">מידע שנאסף אוטומטית:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>כתובת IP (לצורכי אבטחה ולוגים בלבד)</li>
                <li>סוג הדפדפן והמכשיר</li>
                <li>זמני גישה לאפליקציה</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">3. כיצד אנחנו משתמשים במידע</h2>
              <p>אנחנו משתמשים במידע שלכם אך ורק למטרות הבאות:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>חישוב זמני שבת וחגים לפי המיקום שלכם</li>
                <li>שליחת תזכורות והתראות בערוצים שבחרתם</li>
                <li>שיפור חווית המשתמש והאפליקציה</li>
                <li>תמיכה טכנית ופתרון בעיות</li>
              </ul>
              <p className="font-semibold mt-2">
                אנחנו לא מוכרים, משכירים או משתפים את המידע שלכם עם צדדים שלישיים למטרות שיווקיות.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">4. מצב אורח (שימוש אנונימי)</h2>
              <p>
                האפליקציה מאפשרת שימוש ללא הרשמה ("מצב אורח"). במצב זה:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>נוצר מזהה אנונימי ייחודי לשמירת ההגדרות שלכם</li>
                <li>המידע נשמר בעוגיות (cookies) במכשיר שלכם</li>
                <li>אם תמחקו עוגיות או תחליפו מכשיר, לא תוכלו לשחזר את ההגדרות</li>
                <li>לשמירה לטווח ארוך, מומלץ להתחבר עם חשבון Google</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">5. אחסון ואבטחת מידע</h2>
              <p>
                המידע שלכם מאוחסן בשרתי Supabase המאובטחים. אנחנו נוקטים באמצעי אבטחה סבירים
                כדי להגן על המידע שלכם, כולל:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>הצפנת תקשורת (HTTPS/TLS)</li>
                <li>הגבלת גישה לפי משתמש (Row Level Security)</li>
                <li>אימות דו-שלבי לגישה למערכות הניהול</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">6. שירותי צד שלישי</h2>
              <p>האפליקציה משתמשת בשירותים הבאים:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Supabase</strong> — אחסון נתונים ואימות משתמשים</li>
                <li><strong>Google OAuth</strong> — התחברות עם חשבון Google</li>
                <li><strong>Hebcal / Sefaria</strong> — נתוני לוח עברי ותוכן תורני</li>
                <li><strong>WhatsApp/Telegram</strong> — שליחת הודעות (אם הופעל)</li>
              </ul>
              <p>לכל שירות מדיניות פרטיות משלו.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">7. הזכויות שלכם</h2>
              <p>יש לכם את הזכות:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>לדעת איזה מידע אנחנו שומרים עליכם</li>
                <li>לבקש תיקון של מידע שגוי</li>
                <li>לבקש מחיקת המידע שלכם</li>
                <li>להפסיק לקבל התראות בכל עת</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">8. עוגיות (Cookies)</h2>
              <p>
                האפליקציה משתמשת בעוגיות לשמירת מצב ההתחברות וההעדפות שלכם.
                עוגיות אלו הכרחיות לפעולת האפליקציה ואינן משמשות למעקב או פרסום.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">9. שינויים במדיניות</h2>
              <p>
                אנחנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באפליקציה.
                המשך השימוש באפליקציה לאחר עדכון מהווה הסכמה למדיניות המעודכנת.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">10. יצירת קשר</h2>
              <p>לשאלות או בקשות בנוגע לפרטיות:</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <a
                  href="https://wa.me/972509151878"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  וואטסאפ — 050-915-1878
                </a>
                <a
                  href="mailto:liadezer3@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  liadezer3@gmail.com
                </a>
              </div>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ראו גם: <Link to="/terms" className="text-amber-600 hover:underline">תנאי שימוש</Link>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
