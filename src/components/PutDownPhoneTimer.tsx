import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Smartphone, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PutDownPhoneTimerProps {
  minutesToCandles: number | null;
  phase: 'pre-shabbat-rush' | 'shabbat' | string;
  className?: string;
}

export const PutDownPhoneTimer = ({ minutesToCandles, phase, className }: PutDownPhoneTimerProps) => {
  const [pulse, setPulse] = useState(false);

  // Pulse animation every few seconds
  useEffect(() => {
    if (phase === 'pre-shabbat-rush') {
      const interval = setInterval(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 500);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  if (phase === 'shabbat') {
    return (
      <Card className={cn(
        "p-6 text-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border-primary/30 shadow-lg",
        className
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <Moon className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary mb-2">
              🕯️ שבת שלום! 🕯️
            </h3>
            <p className="text-muted-foreground text-lg">
              הניחו את הטלפון ותהנו מהשבת
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (phase === 'pre-shabbat-rush' && minutesToCandles !== null) {
    const hours = Math.floor(minutesToCandles / 60);
    const mins = minutesToCandles % 60;
    
    const isUrgent = minutesToCandles <= 30;
    const isVeryUrgent = minutesToCandles <= 15;

    return (
      <Card className={cn(
        "p-6 text-center shadow-lg transition-all duration-300",
        isVeryUrgent 
          ? "bg-destructive/10 border-destructive/30" 
          : isUrgent 
            ? "bg-secondary/20 border-secondary/40"
            : "bg-primary/10 border-primary/30",
        pulse && "scale-105",
        className
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-colors",
            isVeryUrgent 
              ? "bg-destructive/20" 
              : isUrgent 
                ? "bg-secondary/30"
                : "bg-primary/20",
            pulse && "animate-ping-slow"
          )}>
            <Smartphone className={cn(
              "w-10 h-10",
              isVeryUrgent 
                ? "text-destructive" 
                : isUrgent 
                  ? "text-secondary-foreground"
                  : "text-primary"
            )} />
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className={cn(
                "w-5 h-5",
                isVeryUrgent ? "text-destructive" : isUrgent ? "text-secondary" : "text-primary"
              )} />
              <span className="text-sm font-medium text-muted-foreground">
                זמן עד הדלקת נרות
              </span>
            </div>
            
            <div className={cn(
              "text-4xl font-bold mb-2",
              isVeryUrgent ? "text-destructive" : "text-primary"
            )}>
              {hours > 0 && `${hours} שעות `}
              {mins} דקות
            </div>
            
            <p className="text-lg text-foreground">
              {isVeryUrgent 
                ? "⚡ הזמן אוזל! סיימו את ההכנות ⚡" 
                : isUrgent 
                  ? "🕐 עוד מעט שבת!" 
                  : "🕯️ התכוננו להדלקת נרות"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};
