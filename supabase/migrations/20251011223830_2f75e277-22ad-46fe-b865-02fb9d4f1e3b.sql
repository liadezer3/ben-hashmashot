-- Add all existing users as admins
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('881003bb-e5db-47d6-a3bb-3917cc4deccb', 'admin'),
  ('068b2154-06a7-49de-99c6-645684630f84', 'admin'),
  ('bc77dcbc-f6c1-4bc0-b721-40af9a808ca8', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;