-- invitation_guests: remove direct INSERT capability, keep owner UPDATE/DELETE; inserts only via SECURITY DEFINER RPC rsvp_to_invitation
DROP POLICY IF EXISTS "Invitation owner can manage guests" ON public.invitation_guests;

CREATE POLICY "Invitation owner can update guests"
ON public.invitation_guests
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.shabbat_invitations si WHERE si.id = invitation_guests.invitation_id AND si.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.shabbat_invitations si WHERE si.id = invitation_guests.invitation_id AND si.user_id = auth.uid()));

CREATE POLICY "Invitation owner can delete guests"
ON public.invitation_guests
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.shabbat_invitations si WHERE si.id = invitation_guests.invitation_id AND si.user_id = auth.uid()));

-- user_badges: remove self-insert; awards only via SECURITY DEFINER RPC award_qualified_badges
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;