import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:underline mb-6">
          <ArrowRight className="w-4 h-4" />
          חזרה לדף הבית
        </Link>
        
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl">תנאי שימוש</CardTitle>
            <p className="text-amber-100">עודכן לאחרונה: אוקטובר 2026</p>
          </CardHeader>
          
          <CardContent className="prose prose-amber dark:prose-invert max-w-none p-6 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">1. הסכמה לתנאים</h2>
              <p>
                השימוש באפליקציית "בין השמשות" ("האפליקציה", "השירות") מהווה הסכמה לתנאי שימוש אלו.
                אם אינכם מסכימים לתנאים, אנא הימנעו משימוש באפליקציה.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">2. תיאור השירות</h2>
              <p>
                "בין השמשות" היא אפליקציה חינמית המספקת:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>תזכורות לזמני כניסת ויציאת שבת וחגים</li>
                <li>מידע על זמני תפילה יומיים</li>
                <li>תוכן תורני (פרשת השבוע, דברי תורה)</li>
                <li>כלי תכנון להכנות לשבת</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">3. דיוק הזמנים</h2>
              <p className="font-semibold text-red-600 dark:text-red-400">
                ⚠️ חשוב: הזמנים המוצגים באפליקציה הם להנחיה כללית בלבד.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>הזמנים מחושבים על בסיס מיקום גיאוגרפי ונוסחאות אסטרונומיות</li>
                <li>ייתכנו הבדלים בין המנהג המקומי לבין הזמנים המוצגים</li>
                <li>לזמנים מדויקים למנהג הקהילה, יש להתייעץ עם רב</li>
                <li>האפליקציה אינה מחליפה לוח זמנים של בית כנסת מקומי</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">4. התראות והודעות</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>אנחנו עושים מאמץ לשלוח התראות בזמן, אך אין ערובה ל-100% אמינות</li>
                <li>תקלות טכניות, בעיות רשת או הגדרות מכשיר עלולות למנוע קבלת התראות</li>
                <li>מומלץ לא להסתמך על האפליקציה כמקור יחיד לזמני שבת</li>
                <li>האחריות על הגעה בזמן לשבת היא על המשתמש</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">5. שימוש מקובל</h2>
              <p>בעת השימוש באפליקציה, אתם מתחייבים:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>לא להשתמש באפליקציה למטרות בלתי חוקיות</li>
                <li>לא לנסות לפרוץ או לשבש את פעולת האפליקציה</li>
                <li>לא להתחזות למשתמש אחר</li>
                <li>לא לשלוח תוכן פוגעני דרך פיצ'רים קהילתיים</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">6. קניין רוחני</h2>
              <p>
                האפליקציה, העיצוב, הקוד והתוכן הם בבעלות המפתח ("ליעד עזר")
                או בשימוש ברישיון. אין להעתיק, לשכפל או להפיץ חלקים מהאפליקציה
                ללא אישור בכתב.
              </p>
              <p className="mt-2">
                תוכן תורני ונתוני לוח עברי מסופקים על ידי שירותים חיצוניים
                (Sefaria, Hebcal) בהתאם לתנאי השימוש שלהם.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">7. הגבלת אחריות</h2>
              <p>
                האפליקציה מסופקת "כמות שהיא" (AS IS) ללא אחריות מכל סוג.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>איננו אחראים לנזקים הנובעים משימוש או חוסר יכולת להשתמש באפליקציה</li>
                <li>איננו אחראים לאי-דיוקים בזמנים או בתוכן</li>
                <li>איננו אחראים להפסקות שירות או תקלות טכניות</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">8. שינויים בשירות</h2>
              <p>
                אנחנו שומרים לעצמנו את הזכות לשנות, להשעות או להפסיק את השירות
                (או חלק ממנו) בכל עת, עם או בלי הודעה מראש.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">9. שינויים בתנאים</h2>
              <p>
                אנחנו עשויים לעדכן תנאים אלו מעת לעת. שינויים מהותיים יפורסמו באפליקציה.
                המשך השימוש לאחר עדכון מהווה הסכמה לתנאים המעודכנים.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">10. דין וסמכות שיפוט</h2>
              <p>
                תנאים אלו כפופים לדיני מדינת ישראל. כל מחלוקת תידון בבתי המשפט
                המוסמכים בירושלים.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-amber-800 dark:text-amber-400">11. יצירת קשר</h2>
              <p>לשאלות בנוגע לתנאי השימוש:</p>
              <ul className="list-none space-y-1 mt-2">
                <li>📧 אימייל: <a href="mailto:liadezer3@gmail.com" className="text-amber-600 hover:underline">liadezer3@gmail.com</a></li>
                <li>📱 טלפון: <a href="tel:+972509151878" className="text-amber-600 hover:underline">050-915-1878</a></li>
              </ul>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ראו גם: <Link to="/privacy" className="text-amber-600 hover:underline">מדיניות פרטיות</Link>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
