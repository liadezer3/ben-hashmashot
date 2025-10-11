-- Add unique constraint on user_id in notification_preferences to fix ON CONFLICT error
ALTER TABLE public.notification_preferences 
ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);