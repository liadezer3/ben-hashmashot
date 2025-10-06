import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface Holiday {
  title: string;
  hebrew: string;
  date: string;
  category: string;
}

export const UpcomingHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(
          'https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=now&month=x&ss=on&mf=on&c=on&geo=geoname&geonameid=293397&M=on&s=on&lg=h'
        );
        const data = await response.json();
        
        const holidayItems = data.items
          .filter((item: any) => item.category === 'holiday')
          .slice(0, 3);

        setHolidays(holidayItems);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-card shadow-card animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-soft transition-shadow duration-300">
      <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
        <Calendar className="w-6 h-6 text-accent" />
        חגים קרובים
      </h2>

      <div className="space-y-3">
        {holidays.length > 0 ? (
          holidays.map((holiday, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors"
            >
              <p className="font-semibold text-lg text-foreground">
                {holiday.hebrew || holiday.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{holiday.date}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">
            אין חגים קרובים כרגע
          </p>
        )}
      </div>
    </Card>
  );
};
