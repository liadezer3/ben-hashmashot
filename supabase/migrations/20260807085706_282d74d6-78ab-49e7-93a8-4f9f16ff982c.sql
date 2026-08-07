CREATE TABLE public.bot_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel text NOT NULL CHECK (channel IN ('telegram','whatsapp')),
  external_id text NOT NULL,
  user_id uuid NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, external_id)
);

GRANT SELECT, DELETE ON public.bot_links TO authenticated;
GRANT ALL ON public.bot_links TO service_role;
ALTER TABLE public.bot_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bot links" ON public.bot_links
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own bot links" ON public.bot_links
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_bot_links_updated_at BEFORE UPDATE ON public.bot_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bot_link_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bot_link_codes TO authenticated;
GRANT ALL ON public.bot_link_codes TO service_role;
ALTER TABLE public.bot_link_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own link codes" ON public.bot_link_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.bot_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel text NOT NULL CHECK (channel IN ('telegram','whatsapp')),
  external_id text NOT NULL,
  user_id uuid,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_conversations_chan_ext ON public.bot_conversations (channel, external_id, created_at);

GRANT SELECT ON public.bot_conversations TO authenticated;
GRANT ALL ON public.bot_conversations TO service_role;
ALTER TABLE public.bot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bot conversations" ON public.bot_conversations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.create_bot_link_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  DELETE FROM public.bot_link_codes
  WHERE user_id = auth.uid() AND (used_at IS NOT NULL OR expires_at < now());

  SELECT code INTO v_code
  FROM public.bot_link_codes
  WHERE user_id = auth.uid() AND used_at IS NULL AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.bot_link_codes (code, user_id)
  VALUES (v_code, auth.uid());

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_bot_link_code(p_code text, p_channel text, p_external_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_channel NOT IN ('telegram','whatsapp') THEN
    RAISE EXCEPTION 'INVALID_CHANNEL';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.bot_link_codes
  WHERE code = upper(trim(p_code)) AND used_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  UPDATE public.bot_link_codes SET used_at = now() WHERE code = upper(trim(p_code));

  INSERT INTO public.bot_links (channel, external_id, user_id)
  VALUES (p_channel, p_external_id, v_user_id)
  ON CONFLICT (channel, external_id) DO UPDATE
    SET user_id = EXCLUDED.user_id, linked_at = now(), updated_at = now();

  UPDATE public.bot_conversations
  SET user_id = v_user_id
  WHERE channel = p_channel AND external_id = p_external_id AND user_id IS NULL;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_bot_link_code(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_bot_link_code(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_bot_link_code() TO authenticated;