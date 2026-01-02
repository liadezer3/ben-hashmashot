-- Grant admin role to the specified user (id resolved from profiles)
INSERT INTO public.user_roles (user_id, role)
VALUES ('bc77dcbc-f6c1-4bc0-b721-40af9a808ca8', 'admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;