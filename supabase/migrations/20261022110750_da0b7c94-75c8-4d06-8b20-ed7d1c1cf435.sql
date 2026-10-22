DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Block guest sessions" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Block guest sessions" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (COALESCE((auth.jwt() ->> ''is_anonymous'')::boolean, false) = false) WITH CHECK (COALESCE((auth.jwt() ->> ''is_anonymous'')::boolean, false) = false)', t);
  END LOOP;
END $$;