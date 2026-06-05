import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { ShabbatTimes } from "@/components/ShabbatTimes";
import { Header } from "@/components/Header";
import ParshaContent from "@/components/ParshaContent";
import { ActiveChannelsPanel } from "@/components/ActiveChannelsPanel";
import CandleLightingTracker from "@/components/CandleLightingTracker";
import ShabbatTaskList from "@/components/ShabbatTaskList";
import { HebrewDateDisplay } from "@/components/HebrewDateDisplay";
import { PutDownPhoneTimer } from "@/components/PutDownPhoneTimer";
import { useShabbatMode, getPhaseStyles } from "@/hooks/useShabbatMode";
import { useAutoTheme } from "@/hooks/useAutoTheme";
import { useObservance } from "@/contexts/ObservanceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { KosherShabbatMode } from "@/components/KosherShabbatMode";
import { PhaseTransition } from "@/components/PhaseTransition";
import { EnhancedFamilyHub } from "@/components/EnhancedFamilyHub";
import { 
  BarChart3,
  Settings, 
  Users, 
  Bell, 
  MapPin, 
  BookOpen, 
  Calendar, 
  Home,
  MessageSquare,
  History,
  Star,
  Mic,
  Image as ImageIcon,
  ChevronLeft,
  Smartphone
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showReligiousContent, isSecular } = useObservance();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string>("Jerusalem");
  const [currentParsha, setCurrentParsha] = useState<string>("");
  const [candleLighting, setCandleLighting] = useState<string>("");
  const [havdalah, setHavdalah] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Dynamic mode based on time
  const shabbatMode = useShabbatMode(candleLighting, havdalah);
  const phaseStyles = getPhaseStyles(shabbatMode.phase);

  // Auto dark mode during Shabbat
  useAutoTheme(shabbatMode.phase);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/landing");
      } else {
        setUserId(session.user.id);
        // Load user's city from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('city')
          .eq('id', session.user.id)
          .single();
        if (profile?.city) {
          setUserCity(profile.city);
        }
        // Check if onboarding needed (per-user in DB)
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (!prefs) {
          setShowOnboarding(true);
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/landing");
      } else {
        setUserId(session.user.id);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Handle times loaded from ShabbatTimes component
  const handleTimesLoaded = (times: { candleLighting: string; havdalah: string }) => {
    setCandleLighting(times.candleLighting);
    setHavdalah(times.havdalah);
  };

  if (loading || !userId) {
    return null;
  }

  // Quick links to other features
  const quickLinks = [
    { icon: BarChart3, label: t("features.dashboard"), href: "/dashboard", showAlways: true },
    { icon: Smartphone, label: t("features.widget"), href: "/widget", showAlways: true },
    { icon: Bell, label: t("features.notifications"), href: "/settings?tab=notifications", showAlways: true },
    { icon: MapPin, label: t("features.locations"), href: "/settings?tab=locations", showAlways: true },
    { icon: Users, label: t("features.family"), href: "/settings?tab=family", showAlways: true },
    { icon: Home, label: t("features.smartHome"), href: "/settings?tab=smart-home", showAlways: true },
    { icon: BookOpen, label: t("features.torahContent"), href: "/settings?tab=torah", showAlways: !isSecular },
  ].filter(link => link.showAlways);

  return (
    <>
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
      <KosherShabbatMode
        isActive={shabbatMode.phase === 'shabbat'}
        candleLighting={candleLighting}
        havdalah={havdalah}
        parsha={currentParsha}
        city={userCity}
      />
      <PhaseTransition phase={shabbatMode.phase}>
      <div className={cn("min-h-screen transition-colors duration-500", phaseStyles.bgClass)}>
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Phase indicator */}
        <div className="flex items-center justify-center gap-2 text-lg">
          <span className="text-2xl">{shabbatMode.phaseEmoji}</span>
          <span className={cn("font-medium", phaseStyles.accentClass)}>
            {shabbatMode.phaseLabel}
          </span>
        </div>

        {/* Hebrew Date - Compact */}
        <HebrewDateDisplay variant="full" showGregorian={true} />
        
        {/* Put Down Phone Timer - Shows during rush or Shabbat */}
        {shabbatMode.showPutDownPhone && (
          <PutDownPhoneTimer 
            minutesToCandles={shabbatMode.minutesToCandles}
            phase={shabbatMode.phase}
          />
        )}
        
        {/* Shabbat Times - Core */}
        <ShabbatTimes 
          onParshaLoaded={setCurrentParsha}
          onTimesLoaded={handleTimesLoaded}
        />
        
        {/* Tasks - Only show during preparation phases */}
        {(shabbatMode.phase === 'pre-shabbat-early' || 
          shabbatMode.phase === 'pre-shabbat-prep' || 
          shabbatMode.phase === 'pre-shabbat-rush') && (
          <ShabbatTaskList userId={userId} />
        )}

        {/* Parsha Content - Only for religious/traditional users, not during Shabbat */}
        {showReligiousContent && shabbatMode.phase !== 'shabbat' && (
          <ParshaContent />
        )}

        {/* Active notification channels with quick toggles + test all */}
        <ActiveChannelsPanel />

        {/* Enhanced Family Hub: Sharing, Shopping, Guest Reminders */}
        <EnhancedFamilyHub
          userId={userId}
          candleLighting={candleLighting}
          havdalah={havdalah}
        />

        {/* Candle Lighting Tracker */}
        {showReligiousContent && (
          <CandleLightingTracker userId={userId} />
        )}

        {/* Quick Links to Other Features */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            תכונות נוספות
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                  "hover:bg-primary/5 hover:border-primary/30",
                  phaseStyles.borderClass
                )}
              >
                <link.icon className="w-6 h-6 text-primary" />
                <span className="text-xs text-center text-muted-foreground">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4 gap-2"
            onClick={() => navigate('/settings')}
          >
            {t("features.allSettings")}
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Card>
      </main>

      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
          <p>{t("footer.calculatedBy")}</p>
          <a
            href="mailto:liadezer3@gmail.com"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            liadezer3@gmail.com
          </a>
        </div>
      </footer>
    </div>
    </PhaseTransition>
    </>
  );
};

export default Index;
