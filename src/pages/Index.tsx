import { ShabbatTimes } from "@/components/ShabbatTimes";
import { UpcomingHolidays } from "@/components/UpcomingHolidays";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <ShabbatTimes />
        <UpcomingHolidays />
        <NotificationSettings />
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
