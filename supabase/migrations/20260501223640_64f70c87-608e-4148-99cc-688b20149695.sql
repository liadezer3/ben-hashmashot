-- Create smart_home_settings table for per-user persistence of Hue & Home Assistant configs
CREATE TABLE IF NOT EXISTS public.smart_home_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  hue_config JSONB,
  ha_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_home_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own smart home settings"
  ON public.smart_home_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own smart home settings"
  ON public.smart_home_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart home settings"
  ON public.smart_home_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own smart home settings"
  ON public.smart_home_settings FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_smart_home_settings_updated_at
  BEFORE UPDATE ON public.smart_home_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();