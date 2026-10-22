import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, HelpCircle, Bell, Users, Clock, Smartphone, Shield, MessageCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const FAQ_ITEMS = [
  {
    category: "התראות",
    icon: Bell,
    questions: [
      {
        q: "למה אני לא מקבל התראות?",
        a: `יש כמה סיבות אפשריות:
• ודא שהפעלת התראות Push בדפדפן (יש ללחוץ "אפשר" כשמבקשים הרשאה)
• בדוק שההתראות לא חסומות בהגדרות הטלפון
• באייפון - ודא שהאתר מותקן כאפליקציה (PWA) כי Safari לא תומך ב-Push
• בדוק שהזנת כתובת מייל/טלפון נכונים בהגדרות
• ודא שיש חיבור לאינטרנט`
      },
      {
        q: "מתי נשלחות ההתראות?",
        a: `ברירת המחדל היא תזכורת ביום שישי בשעה 12:00. 
אפשר לשנות את הזמן בהגדרות → התראות.
אפשר גם להוסיף תזכורת נוספת כמה שעות לפני הדלקת נרות.`
      },
      {
        q: "איך מפסיקים לקבל התראות?",
        a: `היכנס להגדרות → התראות וכבה את הערוצים שאתה לא רוצה.
אפשר גם ללחוץ על "הסר מנוי" בתחתית כל מייל שאתה מקבל.`
      },
    ]
  },
  {
    category: "חשבון והתחברות",
    icon: Users,
    questions: [
      {
        q: "מה ההבדל בין מצב אורח להתחברות עם Google?",
        a: `**מצב אורח:**
• נכנסים מיד בלי הרשמה
• ההגדרות נשמרות במכשיר הנוכחי בלבד
• אם תמחק עוגיות או תחליף מכשיר — תאבד את ההגדרות

**התחברות עם Google:**
• ההגדרות נשמרות בענן
• אפשר להתחבר מכל מכשיר
• לא תאבד את ההגדרות לעולם`
      },
      {
        q: "איך עוברים ממצב אורח לחשבון Google?",
        a: `לחץ על "התחברות עם Google" בדף הבית או בהגדרות.
ההגדרות שהגדרת כאורח יועברו אוטומטית לחשבון החדש.`
      },
      {
        q: "איך מוחקים את החשבון?",
        a: `שלח מייל ל-liadezer3@gmail.com עם בקשה למחיקת חשבון.
נמחק את כל המידע שלך תוך 7 ימי עסקים.`
      },
    ]
  },
  {
    category: "זמני שבת",
    icon: Clock,
    questions: [
      {
        q: "האם הזמנים מדויקים?",
        a: `הזמנים מחושבים לפי מיקום גיאוגרפי ונוסחאות אסטרונומיות מקובלות.
**חשוב:** ייתכנו הבדלים קלים בין המנהג המקומי לבין הזמנים המוצגים.
לזמנים מדויקים למנהג הקהילה שלך, התייעץ עם הרב המקומי.`
      },
      {
        q: "איך משנים את המיקום?",
        a: `בדף הבית יש שדה "איפה אתה גר?" — לחץ עליו ובחר עיר אחרת.
אפשר גם ללחוץ על כפתור ה-GPS לזיהוי אוטומטי.`
      },
      {
        q: "מה זה 'הדלקת נרות 40 דקות לפני'?",
        a: `זהו המנהג בירושלים להדליק נרות 40 דקות לפני השקיעה.
ברוב הערים בישראל מדליקים 20-30 דקות לפני.
האפליקציה מחשבת אוטומטית לפי המיקום שלך.`
      },
    ]
  },
  {
    category: "התקנה ושימוש",
    icon: Smartphone,
    questions: [
      {
        q: "איך מתקינים את האפליקציה בטלפון?",
        a: `**באנדרואיד (Chrome):**
לחץ על שלוש הנקודות ← "הוסף למסך הבית"

**באייפון (Safari):**
לחץ על כפתור השיתוף ← "הוסף למסך הבית"

אחרי ההתקנה יופיע אייקון במסך הבית והאפליקציה תיפתח במסך מלא.`
      },
      {
        q: "האם האפליקציה עובדת בלי אינטרנט?",
        a: `חלקית. זמני השבת האחרונים שהוצגו נשמרים במכשיר.
אבל לקבלת זמנים מעודכנים ולשליחת התראות צריך חיבור לאינטרנט.`
      },
      {
        q: "האם האפליקציה בחינם?",
        a: `כן! האפליקציה חינמית לחלוטין ללא פרסומות.
אין תשלומים נסתרים או מנויים.`
      },
    ]
  },
  {
    category: "פרטיות ואבטחה",
    icon: Shield,
    questions: [
      {
        q: "איזה מידע נשמר עליי?",
        a: `רק מה שאתה מזין: מיקום, העדפות התראות, מייל/טלפון (אם הזנת).
אנחנו לא אוספים מידע מיותר ולא משתפים עם צדדים שלישיים.
קרא עוד במדיניות הפרטיות.`
      },
      {
        q: "האם המידע שלי מאובטח?",
        a: `כן. אנחנו משתמשים ב:
• הצפנת HTTPS לכל התקשורת
• Row Level Security — כל משתמש רואה רק את המידע שלו
• אחסון מאובטח בשרתי Supabase`
      },
    ]
  },
];

export default function Help() {
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
              <HelpCircle className="w-6 h-6" />
              עזרה ושאלות נפוצות
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <p className="text-muted-foreground mb-6">
              מצא תשובות לשאלות הנפוצות ביותר. לא מצאת תשובה? צור איתנו קשר!
            </p>

            <div className="space-y-6">
              {FAQ_ITEMS.map((category, idx) => (
                <div key={idx}>
                  <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-3">
                    <category.icon className="w-5 h-5" />
                    {category.category}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((item, qIdx) => (
                      <AccordionItem key={qIdx} value={`${idx}-${qIdx}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-right hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground whitespace-pre-line">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact section */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">עדיין צריך עזרה?</h3>
            <p className="text-muted-foreground mb-4">
              אם לא מצאת תשובה לשאלה שלך, אנחנו כאן בשבילך:
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
                אימייל
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="mt-6 text-center text-sm text-muted-foreground space-x-4 space-x-reverse">
          <Link to="/privacy" className="hover:underline">מדיניות פרטיות</Link>
          <span>•</span>
          <Link to="/terms" className="hover:underline">תנאי שימוש</Link>
          <span>•</span>
          <Link to="/about" className="hover:underline">אודות</Link>
        </div>
      </div>
    </div>
  );
}
