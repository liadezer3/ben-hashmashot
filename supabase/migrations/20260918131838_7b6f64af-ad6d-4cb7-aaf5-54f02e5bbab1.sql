CREATE TABLE public.whatsapp_bot_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  city text NOT NULL DEFAULT 'Jerusalem',
  label text,
  is_active boolean NOT NULL DEFAULT true,
  thursday_enabled boolean NOT NULL DEFAULT true,
  thursday_time time without time zone NOT NULL DEFAULT '18:00',
  friday_enabled boolean NOT NULL DEFAULT true,
  friday_time time without time zone NOT NULL DEFAULT '08:00',
  before_candles_enabled boolean NOT NULL DEFAULT true,
  minutes_before_candles integer NOT NULL DEFAULT 30,
  last_sent_thursday timestamp with time zone,
  last_sent_friday timestamp with time zone,
  last_sent_before_candles timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (phone)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_bot_reminders TO authenticated;
GRANT ALL ON public.whatsapp_bot_reminders TO service_role;

ALTER TABLE public.whatsapp_bot_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp bot reminders"
ON public.whatsapp_bot_reminders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert whatsapp bot reminders"
ON public.whatsapp_bot_reminders FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update whatsapp bot reminders"
ON public.whatsapp_bot_reminders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete whatsapp bot reminders"
ON public.whatsapp_bot_reminders FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_whatsapp_bot_reminders_updated_at
BEFORE UPDATE ON public.whatsapp_bot_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.whatsapp_bot_reminders (phone, city, label)
VALUES ('972509151878', 'Jerusalem', 'בוט וואטסאפ');