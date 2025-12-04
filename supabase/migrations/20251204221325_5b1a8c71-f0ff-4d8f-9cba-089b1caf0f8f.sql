-- Add custom_message column to notification_preferences for custom notification text
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS custom_message text DEFAULT 'שבת שלום! זמני שבת השבוע';

-- Create family_members table for family mode
CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  notify_sms boolean DEFAULT false,
  notify_email boolean DEFAULT false,
  notify_whatsapp boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for family_members
CREATE POLICY "Users can view their own family members"
  ON public.family_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own family members"
  ON public.family_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members"
  ON public.family_members
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members"
  ON public.family_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on family_members
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();