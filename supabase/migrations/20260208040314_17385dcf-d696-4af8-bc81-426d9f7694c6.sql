
-- Create shabbat_ratings table for tracking weekly Shabbat experience
CREATE TABLE public.shabbat_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  shabbat_date DATE NOT NULL,
  parsha TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shabbat_date)
);

-- Enable RLS
ALTER TABLE public.shabbat_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own ratings"
  ON public.shabbat_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ratings"
  ON public.shabbat_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.shabbat_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.shabbat_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_shabbat_ratings_updated_at
  BEFORE UPDATE ON public.shabbat_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
