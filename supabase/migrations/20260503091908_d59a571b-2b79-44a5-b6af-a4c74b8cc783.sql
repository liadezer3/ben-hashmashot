
-- Fix 1: notification_history insert policy
DROP POLICY IF EXISTS "System can insert notification history" ON public.notification_history;
CREATE POLICY "Users insert own notification history"
ON public.notification_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix 2: invitation_guests SELECT - restrict to invitation owner
DROP POLICY IF EXISTS "Anyone can view guests of invitation" ON public.invitation_guests;
CREATE POLICY "Invitation owner can view guests"
ON public.invitation_guests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shabbat_invitations
    WHERE shabbat_invitations.id = invitation_guests.invitation_id
      AND shabbat_invitations.user_id = auth.uid()
  )
);

-- Fix 3: handle_new_user input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  v_full_name := NULLIF(TRIM(SUBSTRING(new.raw_user_meta_data->>'full_name', 1, 200)), '');
  v_phone := new.raw_user_meta_data->>'phone';
  IF v_phone IS NOT NULL THEN
    v_phone := REGEXP_REPLACE(v_phone, '[^0-9+\-\s()]', '', 'g');
    v_phone := SUBSTRING(v_phone, 1, 20);
    v_phone := NULLIF(TRIM(v_phone), '');
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (new.id, new.email, v_full_name, v_phone)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      updated_at = now();
  RETURN new;
END;
$$;
