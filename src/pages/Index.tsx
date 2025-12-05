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

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
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
        <ShabbatTimes />
        
        {/* New Featured Section - Torah Content & Preparation */}
        <div className="grid gap-6 md:grid-cols-2">
          <ParshaContent />
          <ShabbatTaskList userId={userId} />
        </div>
        
        {/* Family Memories - Central Feature */}
        <FamilyMemories userId={userId} />
        
        <SavedLocations />
        <UpcomingHolidays />
        <NotificationSettings />
        <FamilyMembers />
        <NotificationHistory />
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
