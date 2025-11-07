import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShabbatTimes } from "@/components/ShabbatTimes";
import { UpcomingHolidays } from "@/components/UpcomingHolidays";
import { NotificationSettings } from "@/components/NotificationSettings";
import { NotificationHistory } from "@/components/NotificationHistory";
import { SavedLocations } from "@/components/SavedLocations";
import { Header } from "@/components/Header";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <ShabbatTimes />
        <SavedLocations />
        <UpcomingHolidays />
        <NotificationSettings />
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
