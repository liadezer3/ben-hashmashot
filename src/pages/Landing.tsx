import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, MessageSquare, Mail, Smartphone, Clock, MapPin, Users, Check, Star } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Landing = () => {
  useEffect(() => {
    document.title = "תזכורת כניסת שבת ב-SMS, וואטסאפ ומייל | בין השמשות";

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta(
      "description",
      "אל תשכחו להדליק נרות שבת! קבלו תזכורת אוטומטית על כניסת ויציאת שבת ישירות לנייד - SMS, וואטסאפ ומייל. חינם, מדויק לפי המיקום שלכם."
    );
    setMeta("keywords", "תזכורת כניסת שבת, התראת שבת SMS, זמני שבת וואטסאפ, הדלקת נרות תזכורת, זמני כניסת שבת, יציאת שבת, אפליקציית שבת");
    setMeta("og:title", "תזכורת כניסת שבת לנייד - אל תשכחו להדליק נרות", "property");
    setMeta("og:description", "התראות אוטומטיות לכניסת ויציאת שבת ב-SMS, וואטסאפ ומייל. הצטרפו עכשיו בחינם.", "property");
    setMeta("og:type", "website", "property");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/landing";

    // JSON-LD
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "בין השמשות - תזכורת כניסת שבת",
      description:
        "מערכת התראות אוטומטית לכניסת ויציאת שבת וחגים ב-SMS, וואטסאפ ומייל לפי המיקום שלכם.",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web, Android, iOS",
      offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "127" },
    };
    let script = document.getElementById("landing-jsonld") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "landing-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(jsonLd);

    // FAQ JSON-LD
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "איך אני מקבל תזכורת לכניסת שבת ב-SMS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "נרשמים בחינם, בוחרים עיר וערוץ התראה (SMS / וואטסאפ / מייל / פוש), והמערכת שולחת התראה אוטומטית לפני כל כניסת שבת.",
          },
        },
        {
          "@type": "Question",
          name: "האם השירות חינמי?",
          acceptedAnswer: { "@type": "Answer", text: "כן, השימוש באפליקציה ובהתראות הוא חינם לחלוטין." },
        },
        {
          "@type": "Question",
          name: "איך לא לשכוח להדליק נרות שבת?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "מגדירים תזכורת אוטומטית 30 דקות (או כל זמן שתבחרו) לפני הדלקת נרות, והמערכת תשלח לכם התראה לוואטסאפ או SMS.",
          },
        },
      ],
    };
    let faqScript = document.getElementById("landing-faq-jsonld") as HTMLScriptElement | null;
    if (!faqScript) {
      faqScript = document.createElement("script");
      faqScript.id = "landing-faq-jsonld";
      faqScript.type = "application/ld+json";
      document.head.appendChild(faqScript);
    }
    faqScript.text = JSON.stringify(faqLd);
  }, []);

  const channels = [
    { icon: MessageSquare, title: "וואטסאפ", desc: "תזכורת ישירה לוואטסאפ לפני כניסת השבת" },
    { icon: Smartphone, title: "SMS", desc: "הודעת SMS אוטומטית גם בלי אינטרנט" },
    { icon: Mail, title: "אימייל", desc: "סיכום שבועי עם זמנים מדויקים ופרשת השבוע" },
    { icon: Bell, title: "פוש לנייד", desc: "התראה מיידית באפליקציה ובדפדפן" },
  ];

  const benefits = [
    "מדויק לפי המיקום שלכם - בכל עיר בישראל ובעולם",
    "אל תשכחו יותר להדליק נרות בזמן",
    "תזכורות גם לחגים, ראש חודש וצומות",
    "ניהול משפחתי - התראות לכל בני הבית",
    "חינם לחלוטין, ללא פרסומות מציקות",
    "פרשת השבוע ודבר תורה שבועי",
  ];

  const faqs = [
    {
      q: "איך אני מקבל תזכורת לכניסת שבת ב-SMS?",
      a: "נרשמים בחינם בלחיצה על 'התנסו עכשיו', בוחרים את העיר וערוצי ההתראה (SMS / וואטסאפ / מייל / פוש). מהרגע הזה תקבלו אוטומטית התראה לפני כל שבת וחג.",
    },
    {
      q: "האם אפשר לקבל תזכורת רק בוואטסאפ?",
      a: "בהחלט. אפשר להפעיל ולכבות כל ערוץ התראה בנפרד דרך מסך ההגדרות.",
    },
    {
      q: "איך לא לשכוח להדליק נרות שבת?",
      a: "המערכת שולחת תזכורת לפי הזמן שאתם בוחרים - 5, 15, 30 דקות או שעה לפני הדלקת נרות. אפשרות נוספת: התראה גם לבן/בת זוג כדי שכל הבית יהיה מוכן בזמן.",
    },
    {
      q: "האם השירות עולה כסף?",
      a: "לא. כל הפיצ'רים הבסיסיים, כולל ההתראות בכל הערוצים, ניתנים בחינם.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* HERO */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <img
          src={logo}
          alt="לוגו אפליקציית בין השמשות - תזכורת כניסת שבת"
          className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-xl"
        />
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          לא לשכוח <span className="text-primary">כניסת שבת</span> יותר.
          <br />
          תזכורת אוטומטית ישירות לנייד.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          קבלו התראה מדויקת על כניסת ויציאת שבת ב-<strong>וואטסאפ, SMS, מייל ופוש</strong> -
          לפי המיקום שלכם, חינם לחלוטין.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6 shadow-lg gap-2">
              <Bell className="w-5 h-5" />
              התנסו עכשיו - הירשמו וקבלו התראה
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              צפו בזמני שבת השבוע
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span>4.9/5 מ-127 משתמשים מרוצים</span>
        </div>
      </section>

      {/* CHANNELS */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
          התראת כניסת שבת - בכל ערוץ שתבחרו
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          בחרו את הדרך הנוחה לכם לקבל את התזכורת. אפשר גם לשלב כמה ערוצים יחד.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {channels.map((c) => (
            <Card key={c.title} className="p-5 text-center hover:shadow-lg transition-shadow">
              <c.icon className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-bold mb-1">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            למה משפחות בוחרות בבין השמשות?
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">איך זה עובד?</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Users, title: "1. הרשמה מהירה", desc: "נרשמים תוך 30 שניות עם מייל או חשבון Google" },
            { icon: MapPin, title: "2. בוחרים מיקום וערוצים", desc: "מגדירים את העיר והדרך לקבל את התראת השבת" },
            { icon: Clock, title: "3. מקבלים תזכורת", desc: "אוטומטית לפני כל שבת, חג וצום - תמיד בזמן" },
          ].map((s) => (
            <Card key={s.title} className="p-6 text-center">
              <s.icon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">שאלות נפוצות</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((f) => (
            <Card key={f.q} className="p-5">
              <h3 className="font-bold text-lg mb-2 text-primary">{f.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto p-8 md:p-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            מוכנים להפסיק לשכוח את כניסת השבת?
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            הצטרפו עכשיו בחינם וקבלו את ההתראה הראשונה כבר השבת.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-10 py-6 shadow-xl gap-2">
              <Bell className="w-5 h-5" />
              התנסו עכשיו - הירשמו חינם
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            ללא כרטיס אשראי · ללא התחייבות · ביטול בכל רגע
          </p>
        </Card>
      </section>
    </div>
  );
};

export default Landing;
