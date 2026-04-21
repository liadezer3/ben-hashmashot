
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS whatsapp_frequency TEXT NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS whatsapp_morning_time TIME WITHOUT TIME ZONE DEFAULT '08:00:00',
  ADD COLUMN IF NOT EXISTS whatsapp_days_before_shabbat INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_time TIME WITHOUT TIME ZONE DEFAULT '12:00:00';
