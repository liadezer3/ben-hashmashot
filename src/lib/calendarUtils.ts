// Calendar integration utilities for Google Calendar and Apple Calendar (iCal)

interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  reminder?: number; // minutes before event
}

/**
 * Generate iCal (.ics) file content
 */
export const generateICalContent = (event: CalendarEvent): string => {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const formatLocalDate = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  };

  const escapeText = (text: string): string => {
    return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substring(2)}@shabbat-times`;
  const now = formatDate(new Date());

  let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Shabbat Times App//IL
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART;TZID=Asia/Jerusalem:${formatLocalDate(event.startDate)}
DTEND;TZID=Asia/Jerusalem:${formatLocalDate(event.endDate)}
SUMMARY:${escapeText(event.title)}
DESCRIPTION:${escapeText(event.description)}`;

  if (event.location) {
    icalContent += `\nLOCATION:${escapeText(event.location)}`;
  }

  // Add reminder/alarm
  if (event.reminder) {
    icalContent += `
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:${escapeText(event.title)}
TRIGGER:-PT${event.reminder}M
END:VALARM`;
  }

  icalContent += `
END:VEVENT
END:VCALENDAR`;

  return icalContent;
};

/**
 * Download iCal file (for Apple Calendar and others)
 */
export const downloadICalFile = (event: CalendarEvent, filename: string = 'shabbat'): void => {
  const icalContent = generateICalContent(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    details: event.description,
    ctz: 'Asia/Jerusalem',
  });

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Create Shabbat event from times
 */
export const createShabbatEvent = (
  candleLightingTime: string,
  havdalahTime: string,
  parsha: string,
  city: string,
  shabbatDate: string
): CalendarEvent | null => {
  try {
    // Parse the candle lighting time (format: "הדלקת נרות: 16:24" or just "16:24")
    const candleMatch = candleLightingTime.match(/(\d{1,2}):(\d{2})/);
    const havdalahMatch = havdalahTime.match(/(\d{1,2}):(\d{2})/);

    if (!candleMatch || !havdalahMatch) {
      console.error('Could not parse times', { candleLightingTime, havdalahTime });
      return null;
    }

    // Find next Friday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    
    const friday = new Date(today);
    friday.setDate(today.getDate() + daysUntilFriday);
    friday.setHours(parseInt(candleMatch[1]), parseInt(candleMatch[2]), 0, 0);

    const saturday = new Date(friday);
    saturday.setDate(friday.getDate() + 1);
    saturday.setHours(parseInt(havdalahMatch[1]), parseInt(havdalahMatch[2]), 0, 0);

    return {
      title: `🕯️ שבת ${parsha}`,
      description: `כניסת שבת (הדלקת נרות): ${candleLightingTime}\nצאת שבת (הבדלה): ${havdalahTime}\n\nפרשת השבוע: ${parsha}\n\nשבת שלום! ✨`,
      startDate: friday,
      endDate: saturday,
      location: city,
      reminder: 30, // 30 minutes before
    };
  } catch (error) {
    console.error('Error creating Shabbat event:', error);
    return null;
  }
};

/**
 * Open Google Calendar with event
 */
export const addToGoogleCalendar = (event: CalendarEvent): void => {
  const url = generateGoogleCalendarUrl(event);
  window.open(url, '_blank');
};

/**
 * Add to Apple Calendar (download .ics file)
 */
export const addToAppleCalendar = (event: CalendarEvent, parsha: string): void => {
  const filename = `shabbat-${parsha.replace(/\s+/g, '-')}`;
  downloadICalFile(event, filename);
};
