import { Card } from "@/components/ui/card";
import { Calendar, Star } from "lucide-react";
import { useHebrewDate } from "@/hooks/useHebrewDate";
import { Skeleton } from "@/components/ui/skeleton";

interface HebrewDateDisplayProps {
  variant?: 'full' | 'compact' | 'header';
  showGregorian?: boolean;
  className?: string;
}

export const HebrewDateDisplay = ({ 
  variant = 'full', 
  showGregorian = true,
  className = ''
}: HebrewDateDisplayProps) => {
  const { hebrewDate, loading, error } = useHebrewDate();

  if (loading) {
    if (variant === 'header') {
      return <Skeleton className="h-5 w-32" />;
    }
    return (
      <Card className={`p-4 animate-pulse ${className}`}>
        <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </Card>
    );
  }

  if (error || !hebrewDate) {
    return null;
  }

  // Header variant - minimal display for header
  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-2 text-primary-foreground/90 ${className}`}>
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">{hebrewDate.hebrew}</span>
      </div>
    );
  }

  // Compact variant - single line
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Calendar className="w-4 h-4" />
        <span className="text-sm">
          {hebrewDate.dayOfWeek}, {hebrewDate.hebrew}
          {showGregorian && ` | ${hebrewDate.gregorian}`}
        </span>
      </div>
    );
  }

  // Full variant - card display
  return (
    <Card className={`p-6 bg-gradient-to-r from-primary/10 to-secondary/10 shadow-card border-border/50 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
          <Star className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{hebrewDate.dayOfWeek}</p>
          <p className="text-2xl font-bold text-primary">{hebrewDate.hebrew}</p>
          {showGregorian && (
            <p className="text-sm text-muted-foreground mt-1">{hebrewDate.gregorian}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
