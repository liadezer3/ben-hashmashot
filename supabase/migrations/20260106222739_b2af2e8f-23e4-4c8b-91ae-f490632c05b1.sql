-- Create automation_history table for tracking automation events
CREATE TABLE IF NOT EXISTS public.automation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  automation_type TEXT NOT NULL, -- 'shabbat' or 'motzei'
  platform TEXT NOT NULL, -- 'home_assistant' or 'philips_hue'
  action TEXT NOT NULL, -- 'dim_lights', 'close_covers', 'turn_on_lights', etc.
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'pending'
  details TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own automation history" 
ON public.automation_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation history" 
ON public.automation_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation history" 
ON public.automation_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_automation_history_user_id ON public.automation_history(user_id);
CREATE INDEX idx_automation_history_executed_at ON public.automation_history(executed_at DESC);

-- Add city column to family_members for personalized times
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Jerusalem';

-- Add auto_send_shabbat_times column to family_members
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS auto_send_shabbat_times BOOLEAN DEFAULT false;