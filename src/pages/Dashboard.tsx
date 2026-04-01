import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { AnnualStats } from "@/components/dashboard/AnnualStats";
import { ShabbatStreak } from "@/components/dashboard/ShabbatStreak";
import { LastYearMemory } from "@/components/dashboard/LastYearMemory";
import { SynagoguesFinder } from "@/components/dashboard/SynagoguesFinder";
import { SmartReminders } from "@/components/dashboard/SmartReminders";
import NotificationCenter from "@/components/NotificationCenter";

const Dashboard = () => {
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
  }, [navigate]);

  if (loading || !userId) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">הדשבורד שלי</h1>
        </div>

        <SmartReminders userId={userId} />
        <ShabbatStreak userId={userId} />
        <AnnualStats userId={userId} />
        <LastYearMemory userId={userId} />
        <SynagoguesFinder />
        <NotificationCenter />
      </main>
    </div>
  );
};

export default Dashboard;
