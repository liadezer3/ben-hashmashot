
-- 1) Lock down shabbat_invitations: drop public read-all, keep owner ALL
DROP POLICY IF EXISTS "Public can read invitations by code" ON public.shabbat_invitations;

-- Secure lookup by invite code (SECURITY DEFINER bypasses RLS, returns single row only)
CREATE OR REPLACE FUNCTION public.get_invitation_by_code(_code text)
RETURNS TABLE(
  id uuid,
  host_name text,
  shabbat_date date,
  address text,
  message text,
  candle_lighting text,
  havdalah text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, host_name, shabbat_date, address, message, candle_lighting, havdalah
  FROM public.shabbat_invitations
  WHERE invite_code = _code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_code(text) TO anon, authenticated;

-- 2) Tighten invitation_guests INSERT: must reference an existing invitation
DROP POLICY IF EXISTS "Anyone can RSVP" ON public.invitation_guests;

CREATE POLICY "Anyone can RSVP to existing invitation"
ON public.invitation_guests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shabbat_invitations
    WHERE shabbat_invitations.id = invitation_guests.invitation_id
  )
);

-- 3) Remove sensitive tables from realtime publication so guest contacts and invitations aren't broadcast
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'invitation_guests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.invitation_guests';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'shabbat_invitations'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.shabbat_invitations';
  END IF;
END $$;

-- 4) Public-safe reviews view (no user_id exposure)
CREATE OR REPLACE VIEW public.public_app_reviews AS
SELECT id, display_name, rating, review_text, created_at, updated_at
FROM public.app_reviews
WHERE is_approved = true;

GRANT SELECT ON public.public_app_reviews TO anon, authenticated;

-- Restrict the underlying table SELECT to authenticated users only (own rows or admin) — drop the broad public policy
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.app_reviews;

-- Allow authenticated users to read approved reviews from the table too (with user_id, useful for owners/admins)
CREATE POLICY "Users can view their own reviews"
ON public.app_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
