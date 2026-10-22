DROP POLICY IF EXISTS "Authenticated users can view likes" ON public.community_post_likes;
CREATE POLICY "Users can view their own likes" ON public.community_post_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone authenticated can view community posts" ON public.community_posts;
CREATE POLICY "Registered members can view community posts" ON public.community_posts FOR SELECT TO authenticated
USING (COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);