import { Mail, MessageCircle } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">מדיניות פרטיות</h1>
      <div className="space-y-4 text-muted-foreground">
        <p>ברוכים הבאים למדיניות הפרטיות של בין השמשות.</p>
        <h2 className="text-xl font-semibold text-foreground">איסוף מידע</h2>
        <p>אנו אוספים מידע שאתם מספקים לנו באופן ישיר, כגון כתובת דוא"ל, שם ומיקום לצורך חישוב זמני שבת.</p>
        <h2 className="text-xl font-semibold text-foreground">שימוש במידע</h2>
        <p>המידע משמש אותנו לספק לכם את השירותים שלנו, כולל זמני שבת מותאמים, תזכורות והתראות.</p>
        <h2 className="text-xl font-semibold text-foreground">שיתוף מידע</h2>
        <p>איננו משתפים את המידע האישי שלכם עם צדדים שלישיים, למעט כנדרש על פי חוק.</p>
        <h2 className="text-xl font-semibold text-foreground">אבטחת מידע</h2>
        <p>אנו נוקטים באמצעי אבטחה סבירים כדי להגן על המידע האישי שלכם.</p>
        <h2 className="text-xl font-semibold text-foreground">יצירת קשר</h2>
        <p>לשאלות בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו ישירות:</p>
        <div className="flex flex-wrap gap-3 mt-2">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            liadezer3@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
