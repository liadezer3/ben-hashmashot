
-- Create table for custom user playlists per Shabbat phase
CREATE TABLE public.custom_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phase_key TEXT NOT NULL,
  spotify_uri TEXT NOT NULL,
  playlist_name TEXT NOT NULL DEFAULT 'הפלייליסט שלי',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, phase_key)
);

-- Enable RLS
ALTER TABLE public.custom_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own playlists"
  ON public.custom_playlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists"
  ON public.custom_playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON public.custom_playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON public.custom_playlists FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_custom_playlists_updated_at
  BEFORE UPDATE ON public.custom_playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
