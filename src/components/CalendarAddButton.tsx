import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarPlus, Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createShabbatEvent,
  addToGoogleCalendar,
  addToAppleCalendar,
} from "@/lib/calendarUtils";

interface CalendarAddButtonProps {
  candleLighting: string;
  havdalah: string;
  parsha: string;
  city: string;
  shabbatDate: string;
}

export const CalendarAddButton = ({
  candleLighting,
  havdalah,
  parsha,
  city,
  shabbatDate,
}: CalendarAddButtonProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleAddToGoogle = () => {
    const event = createShabbatEvent(candleLighting, havdalah, parsha, city, shabbatDate);
    if (event) {
      addToGoogleCalendar(event);
      toast({
        title: "נפתח Google Calendar",
        description: "האירוע מוכן להוספה ליומן שלך",
      });
    } else {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור את האירוע",
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  const handleAddToApple = () => {
    const event = createShabbatEvent(candleLighting, havdalah, parsha, city, shabbatDate);
    if (event) {
      addToAppleCalendar(event, parsha);
      toast({
        title: "קובץ iCal הורד",
        description: "פתח את הקובץ כדי להוסיף ליומן Apple או אחר",
      });
    } else {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור את האירוע",
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="הוסף ליומן"
          className="mr-1"
        >
          <CalendarPlus className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleAddToGoogle} className="gap-2 cursor-pointer">
          <Calendar className="w-5 h-5 text-blue-500" />
          <span>הוסף ל-Google Calendar</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToApple} className="gap-2 cursor-pointer">
          <Download className="w-5 h-5 text-gray-600" />
          <span>הורד ל-Apple Calendar / אחר</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
