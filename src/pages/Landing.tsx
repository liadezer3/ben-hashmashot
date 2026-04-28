import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, MapPin, MessageSquare, Send, Smartphone, Zap, Coffee, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.jpg";
import whatsappIcon from "@/assets/whatsapp-icon.png";

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "השבת לא תפתיע אותך יותר | בין השמשות - תזכורות חכמות לכניסת השבת";

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
      "תזכורות חכמות לכניסת השבת בדיוק לפי המיקום שלך. בלי הרשמה, בלי סיסמאות. וואטסאפ, טלגרם או פוש לנייד - קליק אחד ואתם מסודרים."
    );
    setMeta("keywords", "תזכורת כניסת שבת, התראות שבת, זמני שבת, וואטסאפ שבת, טלגרם שבת, הדלקת נרות");
    setMeta("og:title", "השבת לא תפתיע אותך יותר", "property");
    setMeta(
      "og:description",
      "תזכורות חכמות לכניסת השבת. בלי הרשמה, בלי סיסמאות. קליק אחד ואתם מסודרים.",
      "property"
    );
    setMeta("og:type", "website", "property");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/landing";
  }, []);

  const handleGuestStart = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      toast({
        title: "ברוכים הבאים! 🌅",
        description: "נכנסתם כאורחים. בואו נגדיר התראות.",
      });
      navigate("/");
    } catch (error: any) {
      // Fallback: if anonymous auth not enabled, send to auth page
      toast({
        title: "מעבירים אתכם לכניסה מהירה",
        description: "אפשר להירשם עם Google בלחיצה אחת.",
      });
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Zap,
      emoji: "🚀",
      title: "אפס חיכוך",
      desc: "לא צריך שם משתמש, לא צריך אימייל ולא צריך להמציא סיסמה שוב. נכנסים ומתחילים.",
    },
    {
      icon: Bell,
      emoji: "🔔",
      title: "התראות איפה שנוח לך",
      desc: "וואטסאפ, טלגרם או התראות פוש לנייד – אנחנו נדאג שהתזכורת תגיע אליך בזמן.",
    },
    {
      icon: MapPin,
      emoji: "📍",
      title: "דיוק מקסימלי",
      desc: "המערכת מזהה אוטומטית איפה אתם נמצאים ומחשבת את זמני השבת המדויקים לרגע הזה.",
    },
    {
      icon: Coffee,
      emoji: "💆",
      title: "להגיע לשבת ברוגע",
      desc: 'במקום לבדוק כל רגע "מתי נכנס?", תנו לנו לעדכן אתכם 30 דקות לפני (או מתי שתחליטו).',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* HERO - lots of whitespace */}
      <section className="container mx-auto px-4 pt-16 md:pt-24 pb-12 max-w-4xl">
        <div className="text-center space-y-8">
          <img
            src={logo}
            alt="בין השמשות"
            className="w-20 h-20 rounded-2xl mx-auto shadow-lg"
          />

          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              השבת
              <br />
              <span className="text-primary">לא תפתיע אותך יותר.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              תזכורות חכמות לכניסת השבת בדיוק לפי המיקום שלך.
              <br />
              בלי להירשם, בלי לזכור סיסמאות ובלי כאבי ראש.
              <br />
              <strong className="text-foreground">קליק אחד – ואתם מסודרים.</strong>
            </p>
          </div>

          {/* Primary CTA */}
          <div className="space-y-4 pt-4">
            <Button
              onClick={handleGuestStart}
              disabled={loading}
              size="lg"
              className="text-lg md:text-xl px-10 py-7 h-auto shadow-2xl gap-3 rounded-full hover:scale-105 transition-transform"
            >
              <Bell className="w-6 h-6" />
              הפעל התראות עכשיו (זה בחינם)
            </Button>

            {/* Channel logos under CTA */}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
              <span>זמין ב:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                  <span>וואטסאפ</span>
                </div>
                <span className="opacity-40">·</span>
                <div className="flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-[#0088cc]" />
                  <span>טלגרם</span>
                </div>
                <span className="opacity-40">·</span>
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span>פוש</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY - generous whitespace */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          למה Ben-Hashmashot?
        </h2>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {benefits.map((b) => (
            <Card
              key={b.title}
              className="p-8 border-border/50 hover:border-primary/30 transition-colors bg-card/50"
            >
              <div className="text-4xl mb-4">{b.emoji}</div>
              <h3 className="text-xl font-bold mb-3">{b.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{b.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS - super simple */}
      <section className="container mx-auto px-4 py-20 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">איך זה עובד?</h2>
          <p className="text-muted-foreground text-lg">(רמז: זה פשוט מדי)</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {[
            "נכנסים לאתר.",
            "בוחרים איך לקבל את ההתראה.",
            "נרגעים. זהו.",
          ].map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-4 p-5 bg-card rounded-xl border border-border"
            >
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                {i + 1}
              </div>
              <span className="text-lg">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container mx-auto px-4 py-20 max-w-2xl text-center space-y-8">
        <Button
          onClick={handleGuestStart}
          disabled={loading}
          size="lg"
          className="text-lg md:text-xl px-10 py-7 h-auto shadow-2xl gap-3 rounded-full hover:scale-105 transition-transform"
        >
          <Bell className="w-6 h-6" />
          הפעל התראות עכשיו (זה בחינם)
        </Button>

        <button
          onClick={() => navigate("/auth")}
          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline flex items-center gap-1 mx-auto"
        >
          רוצה לשמור את ההגדרות לטווח ארוך? התחברות עם Google
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Micro-copy */}
        <p className="text-sm text-muted-foreground italic max-w-md mx-auto leading-relaxed pt-8 border-t border-border">
          אנחנו לא אוספים נתונים מיותרים ולא מציקים.
          <br />
          המטרה שלנו היא רק לעזור לך להיכנס לשבת עם חיוך. 🕯️
        </p>
      </section>
    </div>
  );
};

export default Landing;
