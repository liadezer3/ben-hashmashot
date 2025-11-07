-- Add city column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN city text DEFAULT 'Jerusalem';

-- Create notification history table
CREATE TABLE public.notification_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notification_history
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_history
CREATE POLICY "Users can view their own notification history"
ON public.notification_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification history"
ON public.notification_history
FOR INSERT
WITH CHECK (true);

-- Create saved_locations table for multiple locations support
CREATE TABLE public.saved_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on saved_locations
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_locations
CREATE POLICY "Users can view their own saved locations"
ON public.saved_locations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved locations"
ON public.saved_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved locations"
ON public.saved_locations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved locations"
ON public.saved_locations
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for saved_locations updated_at
CREATE TRIGGER update_saved_locations_updated_at
BEFORE UPDATE ON public.saved_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();