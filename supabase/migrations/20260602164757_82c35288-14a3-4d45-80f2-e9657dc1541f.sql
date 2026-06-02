
-- 1) Secure RSVP: replace open INSERT policy with a SECURITY DEFINER RPC that validates invite_code
DROP POLICY IF EXISTS "Anyone can RSVP to existing invitation" ON public.invitation_guests;

CREATE OR REPLACE FUNCTION public.rsvp_to_invitation(
  p_invite_code text,
  p_guest_name text,
  p_status text,
  p_guest_contact text DEFAULT NULL,
  p_dish text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inv shabbat_invitations%ROWTYPE;
  v_count integer;
  v_guest_id uuid;
BEGIN
  IF p_guest_name IS NULL OR length(trim(p_guest_name)) = 0 THEN
    RAISE EXCEPTION 'GUEST_NAME_REQUIRED';
  END IF;
  IF p_status NOT IN ('accepted','declined','pending') THEN
    RAISE EXCEPTION 'INVALID_STATUS';
  END IF;

  SELECT * INTO v_inv FROM public.shabbat_invitations
  WHERE invite_code = trim(p_invite_code) LIMIT 1;
  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INVITE_CODE';
  END IF;

  SELECT count(*) INTO v_count FROM public.invitation_guests
  WHERE invitation_id = v_inv.id;
  IF v_inv.max_guests IS NOT NULL AND v_count >= v_inv.max_guests THEN
    RAISE EXCEPTION 'GUEST_LIST_FULL';
  END IF;

  INSERT INTO public.invitation_guests (invitation_id, guest_name, guest_contact, status, dish_to_bring, notes)
  VALUES (v_inv.id, left(trim(p_guest_name), 200), left(p_guest_contact, 200), p_status, left(p_dish, 500), left(p_notes, 1000))
  RETURNING id INTO v_guest_id;

  RETURN v_guest_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rsvp_to_invitation(text, text, text, text, text, text) TO anon, authenticated;

-- 2) Secure badges: remove client INSERT policy, award only via server-validated SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can create their own badges" ON public.user_badges;

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

  -- consecutive-day streak ending today/yesterday
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
      ('first_log','total_logs',1),
      ('logs_10','total_logs',10),
      ('logs_50','total_logs',50),
      ('points_100','points',100),
      ('points_500','points',500),
      ('streak_3','streak',3),
      ('streak_7','streak',7),
      ('streak_30','streak',30)
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
