 import { useEffect, useState } from 'react';
 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Sunset, Sunrise, Clock, BookOpen, RefreshCw, WifiOff, Wifi, ArrowLeft } from 'lucide-react';
 import { useOfflineStorage, HALACHIC_TRADITIONS, HalachicTradition } from '@/hooks/useOfflineStorage';
 import { useHebrewDate } from '@/hooks/useHebrewDate';
 import { cn } from '@/lib/utils';
 import { Link } from 'react-router-dom';
 
 // Default halachot for Shabbat
 const DEFAULT_HALACHOT = [
   'הדלקת נרות שבת - מצווה על האישה להדליק',
   'קידוש בליל שבת על היין',
   'איסור מלאכה בשבת',
   'סעודות שבת - שלוש סעודות',
   'הבדלה במוצאי שבת',
 ];
 
 const Widget = () => {
   const { offlineData, isOnline, saveShabbatTimes } = useOfflineStorage();
   const { hebrewDate } = useHebrewDate();
   const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
   const [loading, setLoading] = useState(false);
   const [tradition, setTradition] = useState<HalachicTradition>('ashkenaz');
 
   // Load tradition from localStorage
   useEffect(() => {
     const savedTradition = localStorage.getItem('halachic-tradition');
     if (savedTradition && savedTradition in HALACHIC_TRADITIONS) {
       setTradition(savedTradition as HalachicTradition);
     }
   }, []);
 
   // Fetch fresh data when online
   useEffect(() => {
     if (isOnline && (!offlineData.shabbat || !offlineData.shabbat.candleLighting)) {
       fetchShabbatData();
     }
   }, [isOnline]);
 
   // Update countdown
   useEffect(() => {
     if (!offlineData.shabbat?.candleLighting) return;
 
     const updateCountdown = () => {
       const timeMatch = offlineData.shabbat?.candleLighting.match(/(\d{1,2}):(\d{2})/);
       if (!timeMatch) return;
 
       const now = new Date();
       const today = new Date();
       const candleLightingTime = new Date(today);
       candleLightingTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
 
       // If already passed, set for next Friday
       if (candleLightingTime.getTime() < now.getTime()) {
         const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
         candleLightingTime.setDate(today.getDate() + daysUntilFriday);
       }
 
       const distance = candleLightingTime.getTime() - now.getTime();
 
       if (distance > 0) {
         setCountdown({
           days: Math.floor(distance / (1000 * 60 * 60 * 24)),
           hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
           minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
           seconds: Math.floor((distance % (1000 * 60)) / 1000),
         });
       }
     };
 
     updateCountdown();
     const interval = setInterval(updateCountdown, 1000);
     return () => clearInterval(interval);
   }, [offlineData.shabbat?.candleLighting]);
 
  const fetchShabbatData = async () => {
    setLoading(true);
    try {
      const city = localStorage.getItem('user-city') || 'Jerusalem';
      const z = getShabbatZmanim(city);

      saveShabbatTimes({
        candleLighting: z.candleLightingTime,
        havdalah: z.havdalahTime,
        parashat: z.parsha,
        shabbatEntry: z.shabbatEntryLabel,
        city,
        tradition,
        halachot: DEFAULT_HALACHOT,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error calculating Shabbat data:', error);
    } finally {
      setLoading(false);
    }
  };

 
   const data = offlineData.shabbat;
   const displayHebrewDate = hebrewDate?.hebrew || '';
 
   return (
     <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
       {/* Header */}
       <div className="flex items-center justify-between mb-6">
         <Link to="/" className="p-2 hover:bg-muted rounded-full transition-colors">
           <ArrowLeft className="w-5 h-5" />
         </Link>
         <div className="flex items-center gap-2">
           {isOnline ? (
             <Wifi className="w-4 h-4 text-primary" />
           ) : (
             <WifiOff className="w-4 h-4 text-destructive" />
           )}
           <span className="text-xs text-muted-foreground">
             {isOnline ? 'מחובר' : 'מצב אופליין'}
           </span>
         </div>
         <Button
           variant="ghost"
           size="icon"
           onClick={fetchShabbatData}
           disabled={!isOnline || loading}
           className={cn(loading && 'animate-spin')}
         >
           <RefreshCw className="w-5 h-5" />
         </Button>
       </div>
 
       {/* Hebrew Date */}
       <div className="text-center mb-6">
         <h2 className="text-lg font-medium text-muted-foreground">{displayHebrewDate}</h2>
       </div>
 
       {/* Countdown Timer */}
       {countdown && (
         <Card className="p-6 mb-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
           <div className="text-center">
             <div className="flex items-center justify-center gap-2 mb-3">
               <Clock className="w-6 h-6 text-primary" />
               <span className="text-sm font-medium text-muted-foreground">זמן עד לכניסת שבת</span>
             </div>
             <div className="text-4xl font-bold text-primary dir-ltr">
               {countdown.days > 0 && <span>{countdown.days}י </span>}
               {countdown.hours.toString().padStart(2, '0')}:
               {countdown.minutes.toString().padStart(2, '0')}:
               {countdown.seconds.toString().padStart(2, '0')}
             </div>
           </div>
         </Card>
       )}
 
       {/* Shabbat Times */}
       <div className="grid grid-cols-2 gap-4 mb-6">
         <Card className="p-4 text-center">
           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
             <Sunset className="w-5 h-5 text-primary" />
           </div>
           <p className="text-xs text-muted-foreground mb-1">הדלקת נרות</p>
           <p className="text-xl font-bold">{data?.candleLighting || '--:--'}</p>
         </Card>
 
         <Card className="p-4 text-center">
           <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
             <Sunrise className="w-5 h-5 text-secondary" />
           </div>
           <p className="text-xs text-muted-foreground mb-1">הבדלה</p>
           <p className="text-xl font-bold">{data?.havdalah || '--:--'}</p>
         </Card>
       </div>
 
       {/* Parsha */}
       <Card className="p-4 mb-6">
         <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
             <BookOpen className="w-6 h-6 text-primary" />
           </div>
           <div>
             <p className="text-sm text-muted-foreground">פרשת השבוע</p>
             <p className="text-xl font-bold">{data?.parashat || 'טוען...'}</p>
           </div>
         </div>
       </Card>
 
       {/* Halachot */}
       <Card className="p-4 mb-6">
         <h3 className="font-bold mb-3 flex items-center gap-2">
           <span className="text-lg">📜</span>
           הלכות לשבת
         </h3>
         <ul className="space-y-2">
           {(data?.halachot || DEFAULT_HALACHOT).map((halacha, index) => (
             <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
               <span className="text-primary mt-0.5">•</span>
               <span>{halacha}</span>
             </li>
           ))}
         </ul>
       </Card>
 
       {/* Tradition & City Info */}
       <Card className="p-4">
         <div className="flex items-center justify-between text-sm">
           <span className="text-muted-foreground">עיר:</span>
           <span className="font-medium">{data?.city || 'ירושלים'}</span>
         </div>
         <div className="flex items-center justify-between text-sm mt-2">
           <span className="text-muted-foreground">מסורת:</span>
           <span className="font-medium">
             {HALACHIC_TRADITIONS[tradition]?.name || 'אשכנז'}
           </span>
         </div>
         {data?.lastUpdated && (
           <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t">
             <span className="text-muted-foreground">עודכן לאחרונה:</span>
             <span>{new Date(data.lastUpdated).toLocaleString('he-IL')}</span>
           </div>
         )}
       </Card>
 
       {/* Offline notice */}
       {!isOnline && (
         <div className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
           <p className="text-sm text-destructive">
             📴 מצב אופליין - הנתונים נשמרו מהעדכון האחרון
           </p>
         </div>
       )}
     </div>
   );
 };
 
 export default Widget;