import { Card } from "@/components/ui/card";
import { Sunset, Sunrise } from "lucide-react";
import { useEffect, useState } from "react";

interface ShabbatTime {
  candleLighting: string;
  havdalah: string;
  parashat: string;
  date: string;
}

export const ShabbatTimes = () => {
  const [shabbatTimes, setShabbatTimes] = useState<ShabbatTime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from Hebcal API
    const fetchShabbatTimes = async () => {
      try {
        const response = await fetch(
          'https://www.hebcal.com/shabbat?cfg=json&geonameid=293397&M=on&lg=h'
        );
        const data = await response.json();
        
        const candleLighting = data.items.find((item: any) => item.category === 'candles');
        const havdalah = data.items.find((item: any) => item.category === 'havdalah');
        const parashat = data.items.find((item: any) => item.category === 'parashat');

        setShabbatTimes({
          candleLighting: candleLighting?.title || '',
          havdalah: havdalah?.title || '',
          parashat: parashat?.hebrew || parashat?.title || '',
          date: data.date || '',
        });
      } catch (error) {
        console.error('Error fetching Shabbat times:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShabbatTimes();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-card shadow-card animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-soft transition-shadow duration-300">
      <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-primary" />
        שבת הקרובה
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sunset className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">הדלקת נרות</p>
              <p className="text-xl font-semibold text-foreground">
                {shabbatTimes?.candleLighting || '--:--'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Sunrise className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">צאת השבת</p>
              <p className="text-xl font-semibold text-foreground">
                {shabbatTimes?.havdalah || '--:--'}
              </p>
            </div>
          </div>
        </div>

        {shabbatTimes?.parashat && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">פרשת השבוע</p>
            <p className="text-lg font-semibold text-primary">{shabbatTimes.parashat}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

const Sparkles = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364-2.121 2.121M8.757 15.243l-2.122 2.122m12.728 0-2.121-2.122M8.757 8.757 6.636 6.636" />
  </svg>
);
