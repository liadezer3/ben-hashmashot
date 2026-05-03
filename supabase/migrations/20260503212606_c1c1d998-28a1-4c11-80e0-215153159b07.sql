-- Public lookup function for family group invite codes (used by /invite/:code page)
CREATE OR REPLACE FUNCTION public.get_family_group_by_invite(_code text)
RETURNS TABLE (id uuid, name text, invite_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, invite_code
  FROM public.family_groups
  WHERE invite_code = _code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_family_group_by_invite(text) TO anon, authenticated;