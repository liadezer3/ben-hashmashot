-- Seed: Religious user (strict preset, silent during shabbat)
INSERT INTO public.user_preferences (user_id, observance_level, language, zmanim_preset, silent_during_shabbat, minhag, location, timezone, channels, verified_channels)
VALUES (
  '068b2154-06a7-49de-99c6-645684630f84',
  'religious',
  'he',
  'strict',
  true,
  'אשכנזי - ליטאי',
  '{"lat": 31.7683, "lon": 35.2137, "tz": "Asia/Jerusalem"}',
  'Asia/Jerusalem',
  '{"sms": false, "email": false, "whatsapp": true, "push": true}',
  '{"sms": false, "email": false, "whatsapp": true}'
);

-- Seed: Secular user (lenient preset, weekly email digest)
INSERT INTO public.user_preferences (user_id, observance_level, language, zmanim_preset, silent_during_shabbat, minhag, location, timezone, channels, verified_channels)
VALUES (
  '001244ae-9b15-4dbe-a832-55c3679aa8fd',
  'secular',
  'he',
  'lenient',
  false,
  NULL,
  '{"lat": 32.0853, "lon": 34.7818, "tz": "Asia/Jerusalem"}',
  'Asia/Jerusalem',
  '{"sms": false, "email": true, "whatsapp": false, "push": false}',
  '{"sms": false, "email": true, "whatsapp": false}'
);