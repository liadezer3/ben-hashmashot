
-- Create enums
CREATE TYPE public.observance_level AS ENUM ('religious', 'traditional', 'secular');
CREATE TYPE public.zmanim_preset AS ENUM ('strict', 'standard', 'lenient', 'custom');
CREATE TYPE public.app_language AS ENUM ('he', 'en');

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Core preferences
  observance_level public.observance_level NOT NULL DEFAULT 'traditional',
  language public.app_language NOT NULL DEFAULT 'he',
  minhag TEXT,
  
  -- Location (jsonb: {lat, lon, tz})
  location JSONB,
  multiple_locations JSONB DEFAULT '[]'::jsonb,
  timezone TEXT DEFAULT 'Asia/Jerusalem',
  
  -- Zmanim
  zmanim_preset public.zmanim_preset NOT NULL DEFAULT 'standard',
  custom_offsets JSONB, -- {candleLightingMinutesBefore, shkiahOffset, tzeitOffset}
  
  -- Behavior
  silent_during_shabbat BOOLEAN NOT NULL DEFAULT true,
  
  -- Notification channels
  channels JSONB NOT NULL DEFAULT '{"sms": false, "email": false, "whatsapp": false, "push": true}'::jsonb,
  verified_channels JSONB NOT NULL DEFAULT '{"sms": false, "email": false, "whatsapp": false}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_preferences_timezone ON public.user_preferences (timezone);
CREATE INDEX idx_user_preferences_observance ON public.user_preferences (observance_level);
CREATE INDEX idx_user_preferences_location ON public.user_preferences USING GIN (location jsonb_path_ops);

-- Updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Validation trigger for custom_offsets when preset is 'custom'
CREATE OR REPLACE FUNCTION public.validate_user_preferences()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  -- Validate location structure if provided
  IF NEW.location IS NOT NULL THEN
    IF NOT (NEW.location ? 'lat' AND NEW.location ? 'lon' AND NEW.location ? 'tz') THEN
      RAISE EXCEPTION 'location must contain lat, lon, and tz fields';
    END IF;
  END IF;
  
  -- Validate custom_offsets required when preset is custom
  IF NEW.zmanim_preset = 'custom' AND NEW.custom_offsets IS NULL THEN
    RAISE EXCEPTION 'custom_offsets is required when zmanim_preset is custom';
  END IF;
  
  -- Validate custom_offsets structure if provided
  IF NEW.custom_offsets IS NOT NULL THEN
    IF NOT (NEW.custom_offsets ? 'candleLightingMinutesBefore' AND NEW.custom_offsets ? 'shkiahOffset' AND NEW.custom_offsets ? 'tzeitOffset') THEN
      RAISE EXCEPTION 'custom_offsets must contain candleLightingMinutesBefore, shkiahOffset, and tzeitOffset';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_user_preferences_trigger
  BEFORE INSERT OR UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_preferences();
