import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShabbatTimes } from "@/components/ShabbatTimes";
import { UpcomingHolidays } from "@/components/UpcomingHolidays";
import { NotificationSettings } from "@/components/NotificationSettings";
import { NotificationHistory } from "@/components/NotificationHistory";
import { SavedLocations } from "@/components/SavedLocations";
import { FamilyMembers } from "@/components/FamilyMembers";
import { Header } from "@/components/Header";
import ParshaContent from "@/components/ParshaContent";
import ShabbatTaskList from "@/components/ShabbatTaskList";
import FamilyMemories from "@/components/FamilyMemories";
import { AppReviews } from "@/components/AppReviews";
import { AppPromotion } from "@/components/AppPromotion";
import SefariaContent from "@/components/SefariaContent";
import SmartHomeSettings from "@/components/SmartHomeSettings";
import VoiceAssistant from "@/components/VoiceAssistant";
import { AutomationHistory } from "@/components/AutomationHistory";
import { WebPushSettings } from "@/components/WebPushSettings";
import { HebrewDateDisplay } from "@/components/HebrewDateDisplay";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string>("Jerusalem");
  const [currentParsha, setCurrentParsha] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
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
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading || !userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hebrew Date - Today */}
        <HebrewDateDisplay variant="full" showGregorian={true} />
        
        <ShabbatTimes onParshaLoaded={setCurrentParsha} />
        
        {/* Torah Content & Preparation */}
        <div className="grid gap-6 md:grid-cols-2">
          <ParshaContent />
          <ShabbatTaskList userId={userId} />
        </div>

        {/* Sefaria - Torah Sources & Commentary */}
        <SefariaContent currentParsha={currentParsha} />
        
        {/* Family Memories - Central Feature */}
        <FamilyMemories userId={userId} />

        {/* Voice Assistant */}
        <VoiceAssistant city={userCity} />

        {/* Smart Home Settings with Automation History */}
        <SmartHomeSettings />
        <AutomationHistory userId={userId} />

        {/* Web Push Notifications */}
        <WebPushSettings />
        
        <SavedLocations />
        <UpcomingHolidays />
        <NotificationSettings />
        <FamilyMembers />
        <NotificationHistory />
        <AppReviews />
        <AppPromotion />
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>זמני שבת וחגים מחושבים לפי לוח שנה עברי עם התחשבות בשעון קיץ וחורף</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
