-- Omer counting tracker
CREATE TABLE public.omer_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 49),
  counted_at timestamptz NOT NULL DEFAULT now(),
  year integer NOT NULL DEFAULT extract(year from now()),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_number, year)
);

ALTER TABLE public.omer_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own omer counts"
  ON public.omer_counts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Candle lighting tracker
CREATE TABLE public.candle_lighting_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shabbat_date date NOT NULL,
  lit_at timestamptz DEFAULT now(),
  blessing_said boolean DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, shabbat_date)
);

ALTER TABLE public.candle_lighting_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own candle lighting log"
  ON public.candle_lighting_log FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Family events calendar
CREATE TABLE public.family_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'general',
  event_date date NOT NULL,
  hebrew_date text,
  is_recurring boolean DEFAULT false,
  recurrence_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.family_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and group events"
  ON public.family_events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR (group_id IS NOT NULL AND public.is_family_group_member(group_id, auth.uid()))
  );

CREATE POLICY "Users can insert own events"
  ON public.family_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON public.family_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON public.family_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_family_events_updated_at
  BEFORE UPDATE ON public.family_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();