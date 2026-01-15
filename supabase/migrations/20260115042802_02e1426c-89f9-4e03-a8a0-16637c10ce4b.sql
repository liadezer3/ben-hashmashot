-- Add days_before_shabbat column to notification_preferences
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS days_before_shabbat integer DEFAULT 0;

-- Add specific time for shabbat reminder
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS shabbat_reminder_time time without time zone DEFAULT '12:00:00'::time without time zone;

COMMENT ON COLUMN public.notification_preferences.days_before_shabbat IS 'Number of days before Shabbat/holiday to send reminder (0 = same day)';
COMMENT ON COLUMN public.notification_preferences.shabbat_reminder_time IS 'Specific time to send Shabbat/holiday reminder';