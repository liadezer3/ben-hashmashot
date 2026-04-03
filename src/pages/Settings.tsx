import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { useObservance } from "@/contexts/ObservanceContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  MapPin, 
  Users, 
  Home, 
  BookOpen, 
  Image as ImageIcon,
  History,
  Star,
  Mic,
  ArrowRight,
  Calendar,
  Music,
  Users2,
  BarChart3,
  SlidersHorizontal,
  ChefHat,
  FileText,
  ShoppingCart,
  Megaphone,
  Mail,
  Flame,
  CalendarHeart
} from "lucide-react";

// Import all feature components
import { NotificationSettings } from "@/components/NotificationSettings";
import { NotificationHistory } from "@/components/NotificationHistory";
import { SavedLocations } from "@/components/SavedLocations";
import { FamilyMembers } from "@/components/FamilyMembers";
import { FamilyGroups } from "@/components/FamilyGroups";
import SmartHomeSettings from "@/components/SmartHomeSettings";
import { AutomationHistory } from "@/components/AutomationHistory";
import { WebPushSettings } from "@/components/WebPushSettings";
import { UpcomingHolidays } from "@/components/UpcomingHolidays";
import SefariaContent from "@/components/SefariaContent";
import FamilyMemories from "@/components/FamilyMemories";
import { AppReviews } from "@/components/AppReviews";
import { AppPromotion } from "@/components/AppPromotion";
import VoiceAssistant from "@/components/VoiceAssistant";
import { TraditionSelector } from "@/components/TraditionSelector";
import ShabbatMusicPlayer from "@/components/ShabbatMusicPlayer";
import CommunityFeed from "@/components/community/CommunityFeed";
import ShabbatRating from "@/components/ShabbatRating";
import UserPreferencesPanel from "@/components/UserPreferencesPanel";
import { ShoppingList } from "@/components/ShoppingList";
import { GuestInvitations } from "@/components/GuestInvitations";
import { AIRecipes } from "@/components/AIRecipes";
import { ShabbatSummary } from "@/components/ShabbatSummary";
import { FamilyShoppingLists } from "@/components/FamilyShoppingLists";
import NotificationCenter from "@/components/NotificationCenter";
import OmerCounter from "@/components/OmerCounter";
import CandleLightingTracker from "@/components/CandleLightingTracker";
import FamilyEventsCalendar from "@/components/FamilyEventsCalendar";

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string>("Jerusalem");
  const { showReligiousContent } = useObservance();
  
  const defaultTab = searchParams.get('tab') || 'notifications';

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
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
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">הגדרות ותכונות</h1>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="preferences" className="gap-1 text-sm">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">העדפות</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 text-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">התראות</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-1 text-sm">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">מיקומים</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="gap-1 text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">משפחה</span>
            </TabsTrigger>
            <TabsTrigger value="smart-home" className="gap-1 text-sm">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">בית חכם</span>
            </TabsTrigger>
            {showReligiousContent && (
              <TabsTrigger value="torah" className="gap-1 text-sm">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">תורה</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="memories" className="gap-1 text-sm">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">זכרונות</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-1 text-sm">
              <Users2 className="w-4 h-4" />
              <span className="hidden sm:inline">קהילה</span>
            </TabsTrigger>
            <TabsTrigger value="music" className="gap-1 text-sm">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">מוזיקה</span>
            </TabsTrigger>
            <TabsTrigger value="rating" className="gap-1 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">דירוג</span>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-1 text-sm">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">הזמנות</span>
            </TabsTrigger>
            <TabsTrigger value="recipes" className="gap-1 text-sm">
              <ChefHat className="w-4 h-4" />
              <span className="hidden sm:inline">מתכונים</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-1 text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">סיכום</span>
            </TabsTrigger>
            <TabsTrigger value="notification-center" className="gap-1 text-sm">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">מרכז התראות</span>
            </TabsTrigger>
            <TabsTrigger value="more" className="gap-1 text-sm">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">עוד</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-6">
            <UserPreferencesPanel />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
            <WebPushSettings />
            <NotificationHistory />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <SavedLocations />
            <TraditionSelector />
            <UpcomingHolidays />
          </TabsContent>

          <TabsContent value="family" className="space-y-6">
            <FamilyGroups />
            <FamilyMembers />
            <FamilyShoppingLists userId={userId} />
          </TabsContent>

          <TabsContent value="smart-home" className="space-y-6">
            <SmartHomeSettings />
            <AutomationHistory userId={userId} />
          </TabsContent>

          {showReligiousContent && (
            <TabsContent value="torah" className="space-y-6">
              <SefariaContent currentParsha="" />
              <VoiceAssistant city={userCity} />
            </TabsContent>
          )}

          <TabsContent value="memories" className="space-y-6">
            <FamilyMemories userId={userId} />
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <CommunityFeed userId={userId} />
          </TabsContent>

          <TabsContent value="music" className="space-y-6">
            <ShabbatMusicPlayer userId={userId} />
          </TabsContent>

          <TabsContent value="rating" className="space-y-6">
            <ShabbatRating userId={userId} />
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <GuestInvitations userId={userId} />
          </TabsContent>

          <TabsContent value="recipes" className="space-y-6">
            <AIRecipes userId={userId} />
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <ShabbatSummary userId={userId} />
          </TabsContent>

          <TabsContent value="notification-center" className="space-y-6">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="more" className="space-y-6">
            <AppReviews />
            <AppPromotion />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
