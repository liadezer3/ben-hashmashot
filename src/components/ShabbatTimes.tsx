import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sunset, Sunrise, Sun, Moon, Clock, Share2, Calendar, MessageCircle, Mail, Copy, Link } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shareShabbatTimes, shareViaWhatsApp, shareViaEmail, copyToClipboard, formatShabbatTimesForShare } from "@/lib/shareUtils";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import gmailIcon from "@/assets/gmail-icon.png";
import { CalendarAddButton } from "./CalendarAddButton";

interface ShabbatTime {
  candleLighting: string;
  havdalah: string;
  parashat: string;
  date: string;
  shabbatEntry: string; // כניסת שבת - התאריך המפורמט
  sunrise?: string;
  sunset?: string;
  tzeit?: string;
  alot?: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const ShabbatTimes = () => {
  const [shabbatTimes, setShabbatTimes] = useState<ShabbatTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("Jerusalem");
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);
  const { toast } = useToast();

  const getShareText = () => {
    if (!shabbatTimes) return '';
    return `🕯️ זמני שבת ב${city}

📅 כניסת שבת: ${shabbatTimes.shabbatEntry}
📖 ${shabbatTimes.parashat}

🌅 הדלקת נרות: ${shabbatTimes.candleLighting}
🌃 הבדלה: ${shabbatTimes.havdalah}

🔗 הורד את האפליקציה: ${window.location.origin}

שבת שלום! ✨`;
  };

  const handleShareNative = async () => {
    if (!shabbatTimes) return;
    
    const result = await shareShabbatTimes(
      city,
      shabbatTimes.candleLighting,
      shabbatTimes.havdalah,
      shabbatTimes.parashat
    );

    if (result.success) {
      toast({
        title: result.method === 'native' ? "שותף בהצלחה!" : "הועתק!",
        description: result.method === 'clipboard' ? "הזמנים הועתקו ללוח" : undefined,
      });
    } else {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשתף",
        variant: "destructive",
      });
    }
  };

  const handleShareWhatsApp = () => {
    const text = getShareText();
    shareViaWhatsApp(text);
  };

  const handleShareEmail = () => {
    if (!shabbatTimes) return;
    const subject = `זמני שבת - ${shabbatTimes.parashat}`;
    const body = getShareText();
    shareViaEmail(subject, body);
  };

  const handleCopyLink = async () => {
    const copied = await copyToClipboard(window.location.origin);
    if (copied) {
      toast({
        title: "הקישור הועתק!",
        description: "כעת ניתן לשתף את הקישור",
      });
    }
  };

  const handleCopyTimes = async () => {
    const text = getShareText();
    const copied = await copyToClipboard(text);
    if (copied) {
      toast({
        title: "הועתק!",
        description: "זמני השבת הועתקו ללוח",
      });
    }
  };

  useEffect(() => {
    loadUserCity();
  }, []);

  useEffect(() => {
    if (city) {
      fetchShabbatTimes();
    }
  }, [city]);

  useEffect(() => {
    if (shabbatTimes?.candleLighting) {
      const interval = setInterval(() => {
        updateCountdown();
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [shabbatTimes]);

  const loadUserCity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCity("Jerusalem");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("city")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data?.city) {
        setCity(data.city);
      }
    } catch (error) {
      console.error("Error loading user city:", error);
      setCity("Jerusalem");
    }
  };

  const getCityGeoId = (cityName: string) => {
    const cities: { [key: string]: string } = {
      "Jerusalem": "281184",
      "ירושלים": "281184",
      "Tel Aviv": "293397",
      "תל אביב": "293397",
      "Haifa": "294801",
      "חיפה": "294801",
      "Beersheba": "295530",
      "באר שבע": "295530",
      "Netanya": "293100",
      "נתניה": "293100",
      "Bnei Brak": "295432",
      "בני ברק": "295432",
      "Ramat Gan": "293703",
      "רמת גן": "293703",
      "Ashdod": "295629",
      "אשדוד": "295629",
      "Petah Tikva": "293703",
      "פתח תקווה": "293703"
    };
    return cities[cityName] || "281184";
  };

  const updateCountdown = () => {
    if (!shabbatTimes?.candleLighting) return;

    const now = new Date().getTime();
    const timeMatch = shabbatTimes.candleLighting.match(/(\d{1,2}):(\d{2})/);
    
    if (!timeMatch) return;

    const today = new Date();
    const candleLightingTime = new Date(today);
    candleLightingTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
    
    if (candleLightingTime.getTime() < now) {
      const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
      candleLightingTime.setDate(today.getDate() + daysUntilFriday);
    }

    const distance = candleLightingTime.getTime() - now;

    if (distance > 0) {
      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }
  };

  const fetchShabbatTimes = async () => {
    try {
      const geoId = getCityGeoId(city);
      const response = await fetch(
        `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on&lg=h`
      );
      const data = await response.json();
      
      const candleLighting = data.items.find((item: any) => item.category === 'candles');
      const havdalah = data.items.find((item: any) => item.category === 'havdalah');
      const parashat = data.items.find((item: any) => item.category === 'parashat');
      const zmanim = data.items.filter((item: any) => item.category === 'zmanim');

      // Format Shabbat entry date
      let shabbatEntryDate = '';
      if (candleLighting?.date) {
        const candleDate = new Date(candleLighting.date);
        const hebrewDateFormatter = new Intl.DateTimeFormat('he-IL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        shabbatEntryDate = hebrewDateFormatter.format(candleDate);
      }

      setShabbatTimes({
        candleLighting: candleLighting?.title || '',
        havdalah: havdalah?.title || '',
        parashat: parashat?.hebrew || parashat?.title || '',
        date: data.date || '',
        shabbatEntry: shabbatEntryDate,
        sunrise: zmanim.find((z: any) => z.title.includes('זריחה') || z.title.includes('Sunrise'))?.title,
        sunset: zmanim.find((z: any) => z.title.includes('שקיעה') || z.title.includes('Sunset'))?.title,
        tzeit: zmanim.find((z: any) => z.title.includes('צאת') || z.title.includes('Nightfall'))?.title,
        alot: zmanim.find((z: any) => z.title.includes('עלות') || z.title.includes('Dawn'))?.title,
      });
    } catch (error) {
      console.error('Error fetching Shabbat times:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">זמני השבת ב{city}</h2>
          
          {/* Calendar Add Button */}
          {shabbatTimes && (
            <CalendarAddButton
              candleLighting={shabbatTimes.candleLighting}
              havdalah={shabbatTimes.havdalah}
              parsha={shabbatTimes.parashat}
              city={city}
              shabbatDate={shabbatTimes.shabbatEntry}
            />
          )}

          {/* Share dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="שתף זמני שבת"
                className="mr-2"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShareWhatsApp} className="gap-2 cursor-pointer">
                <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                <span>שתף בוואטסאפ</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareEmail} className="gap-2 cursor-pointer">
                <img src={gmailIcon} alt="Email" className="w-5 h-5" />
                <span>שלח במייל</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyTimes} className="gap-2 cursor-pointer">
                <Copy className="w-5 h-5" />
                <span>העתק זמנים</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                <Link className="w-5 h-5" />
                <span>העתק קישור לאפליקציה</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareNative} className="gap-2 cursor-pointer">
                <Share2 className="w-5 h-5" />
                <span>שיתוף מתקדם</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {countdown && (
          <Card className="p-4 bg-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">ספירה לאחור:</span>
            </div>
            <div className="text-xl font-bold text-center">
              {countdown.days > 0 && <span>{countdown.days}י </span>}
              {countdown.hours.toString().padStart(2, '0')}:
              {countdown.minutes.toString().padStart(2, '0')}:
              {countdown.seconds.toString().padStart(2, '0')}
            </div>
          </Card>
        )}
      </div>

      {/* Shabbat Entry Date Card - NEW */}
      {shabbatTimes?.shabbatEntry && (
        <Card className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 shadow-card border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">כניסת שבת</p>
              <p className="text-xl font-bold">{shabbatTimes.shabbatEntry}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-soft transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sunset className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">הדלקת נרות</p>
              <p className="text-xl font-semibold">{shabbatTimes?.candleLighting || '--:--'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-soft transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Sunrise className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">הבדלה</p>
              <p className="text-xl font-semibold">{shabbatTimes?.havdalah || '--:--'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-soft transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">פרשת השבוע</p>
              <p className="text-lg font-semibold">{shabbatTimes?.parashat}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-card shadow-card border-border/50">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5 text-primary" />
          זמנים נוספים
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-border">
            <Sunrise className="w-6 h-6 text-primary mb-2" />
            <span className="text-sm text-muted-foreground text-center">עלות השחר</span>
            <span className="font-bold">{shabbatTimes?.alot || '5:24'}</span>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-border">
            <Sun className="w-6 h-6 text-primary mb-2" />
            <span className="text-sm text-muted-foreground text-center">זריחה</span>
            <span className="font-bold">{shabbatTimes?.sunrise || '6:15'}</span>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-border">
            <Sunset className="w-6 h-6 text-primary mb-2" />
            <span className="text-sm text-muted-foreground text-center">שקיעה</span>
            <span className="font-bold">{shabbatTimes?.sunset || '17:04'}</span>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-border">
            <Moon className="w-6 h-6 text-primary mb-2" />
            <span className="text-sm text-muted-foreground text-center">צאת הכוכבים</span>
            <span className="font-bold">{shabbatTimes?.tzeit || '17:47'}</span>
          </div>
        </div>
      </Card>
    </div>
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
