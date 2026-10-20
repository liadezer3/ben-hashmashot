DROP POLICY IF EXISTS "Allow public read access to זמני שבת וחג" ON public."זמני שבת וחג";
CREATE POLICY "Only admins can read זמני שבת וחג" ON public."זמני שבת וחג"
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.scrub_community_post_pii()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  email_re text := '[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}';
  phone_re text := '(\+?\d[\d\s\-()]{7,}\d)';
BEGIN
  NEW.display_name := left(trim(coalesce(NEW.display_name, '')), 60);
  IF NEW.display_name = '' OR NEW.display_name ~ email_re OR NEW.display_name ~ phone_re OR position('@' in NEW.display_name) > 0 THEN
    NEW.display_name := 'חבר/ת קהילה';
  END IF;
  IF NEW.content IS NOT NULL THEN
    NEW.content := regexp_replace(NEW.content, email_re, '[הוסתר]', 'g');
    NEW.content := regexp_replace(NEW.content, phone_re, '[הוסתר]', 'g');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS scrub_community_post_pii_trigger ON public.community_posts;
CREATE TRIGGER scrub_community_post_pii_trigger BEFORE INSERT OR UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.scrub_community_post_pii();

UPDATE public.community_posts SET content = content WHERE true;