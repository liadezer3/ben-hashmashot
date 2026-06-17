-- 1. Block direct INSERT into invitation_guests (RSVPs only via SECURITY DEFINER RPC)
CREATE POLICY "No direct client inserts on invitation_guests"
ON public.invitation_guests
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 2. Block direct INSERT into user_badges (awards only via SECURITY DEFINER RPC)
CREATE POLICY "No direct client inserts on user_badges"
ON public.user_badges
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 3. Restrict EXECUTE on internal helper / trigger SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_family_group_member(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_family_group_admin(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_user_preferences() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
-- award_qualified_badges + join_family_group_by_code only needed by signed-in users
REVOKE EXECUTE ON FUNCTION public.award_qualified_badges() FROM anon;
REVOKE EXECUTE ON FUNCTION public.join_family_group_by_code(text, text) FROM anon;

-- 4. Tighten community-images storage policies (public bucket still serves via public URL,
--    but listing/enumeration through the storage API is restricted to owners)
DROP POLICY IF EXISTS "Community images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own community images" ON storage.objects;

CREATE POLICY "Users can list their own community images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can delete their own community images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- 5. Scope Realtime for the public halachic times table to authenticated subscribers
CREATE POLICY "Authenticated can listen to public zmanim channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() = 'זמני שבת וחג');