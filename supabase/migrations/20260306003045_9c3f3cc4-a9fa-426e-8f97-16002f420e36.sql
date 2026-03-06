-- Secure join by invite code without exposing family_groups rows via RLS
CREATE OR REPLACE FUNCTION public.join_family_group_by_code(p_invite_code text, p_display_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  SELECT id
  INTO v_group_id
  FROM public.family_groups
  WHERE invite_code = lower(trim(p_invite_code))
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INVITE_CODE';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.family_group_members
    WHERE group_id = v_group_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ALREADY_MEMBER';
  END IF;

  INSERT INTO public.family_group_members (group_id, user_id, display_name, role)
  VALUES (
    v_group_id,
    auth.uid(),
    COALESCE(NULLIF(trim(p_display_name), ''), 'אנונימי'),
    'member'
  );

  RETURN v_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_family_group_by_code(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_family_group_by_code(text, text) TO authenticated;