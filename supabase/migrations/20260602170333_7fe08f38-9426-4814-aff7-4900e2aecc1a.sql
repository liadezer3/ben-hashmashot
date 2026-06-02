CREATE OR REPLACE FUNCTION public.award_qualified_badges()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_total integer;
  v_points integer;
  v_streak integer := 0;
  v_awarded text[] := ARRAY[]::text[];
  v_badge record;
  v_qualifies boolean;
  d date;
  prev date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;

  SELECT count(*), COALESCE(sum(points),0) INTO v_total, v_points
  FROM public.habit_logs WHERE user_id = v_uid;

  prev := NULL;
  FOR d IN SELECT DISTINCT log_date FROM public.habit_logs WHERE user_id = v_uid ORDER BY log_date DESC LOOP
    IF prev IS NULL THEN
      IF d = CURRENT_DATE OR d = CURRENT_DATE - 1 THEN v_streak := 1; ELSE EXIT; END IF;
    ELSIF d = prev - 1 THEN v_streak := v_streak + 1;
    ELSE EXIT;
    END IF;
    prev := d;
  END LOOP;

  FOR v_badge IN
    SELECT * FROM (VALUES
      ('first_step','total_logs',1),
      ('ten_mitzvot','total_logs',10),
      ('fifty_mitzvot','total_logs',50),
      ('hundred_points','points',100),
      ('five_hundred_points','points',500),
      ('week_streak','streak',7),
      ('month_streak','streak',30)
    ) AS b(key, btype, threshold)
  LOOP
    v_qualifies := (v_badge.btype = 'total_logs' AND v_total >= v_badge.threshold)
                OR (v_badge.btype = 'points' AND v_points >= v_badge.threshold)
                OR (v_badge.btype = 'streak' AND v_streak >= v_badge.threshold);
    IF v_qualifies AND NOT EXISTS (
      SELECT 1 FROM public.user_badges WHERE user_id = v_uid AND badge_key = v_badge.key
    ) THEN
      INSERT INTO public.user_badges (user_id, badge_key) VALUES (v_uid, v_badge.key);
      v_awarded := array_append(v_awarded, v_badge.key);
    END IF;
  END LOOP;

  RETURN v_awarded;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_qualified_badges() TO authenticated;