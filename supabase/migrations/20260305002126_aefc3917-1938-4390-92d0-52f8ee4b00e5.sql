
-- Shopping list items (shared within family groups)
CREATE TABLE public.shopping_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.family_groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  quantity text DEFAULT '1',
  category text DEFAULT 'כללי',
  is_purchased boolean DEFAULT false,
  added_by uuid NOT NULL,
  added_by_name text NOT NULL DEFAULT 'אנונימי',
  purchased_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS: Members of the group can CRUD
CREATE POLICY "Members can view shopping items" ON public.shopping_list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_group_members WHERE group_id = shopping_list_items.group_id AND user_id = auth.uid())
);
CREATE POLICY "Members can add shopping items" ON public.shopping_list_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM family_group_members WHERE group_id = shopping_list_items.group_id AND user_id = auth.uid())
);
CREATE POLICY "Members can update shopping items" ON public.shopping_list_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM family_group_members WHERE group_id = shopping_list_items.group_id AND user_id = auth.uid())
);
CREATE POLICY "Members can delete shopping items" ON public.shopping_list_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM family_group_members WHERE group_id = shopping_list_items.group_id AND user_id = auth.uid())
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list_items;

-- Shabbat invitations
CREATE TABLE public.shabbat_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shabbat_date date NOT NULL,
  host_name text NOT NULL DEFAULT '',
  address text DEFAULT '',
  message text DEFAULT '',
  candle_lighting text DEFAULT '',
  havdalah text DEFAULT '',
  invite_code text UNIQUE NOT NULL DEFAULT substring(md5(random()::text || clock_timestamp()::text), 1, 10),
  max_guests integer DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shabbat_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invitations" ON public.shabbat_invitations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read invitations by code" ON public.shabbat_invitations FOR SELECT USING (true);

-- Invitation guests (potluck built in)
CREATE TABLE public.invitation_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES public.shabbat_invitations(id) ON DELETE CASCADE NOT NULL,
  guest_name text NOT NULL,
  guest_contact text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'maybe')),
  dish_to_bring text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invitation_guests ENABLE ROW LEVEL SECURITY;

-- Owner of invitation can see all guests
CREATE POLICY "Invitation owner can manage guests" ON public.invitation_guests FOR ALL USING (
  EXISTS (SELECT 1 FROM shabbat_invitations WHERE id = invitation_guests.invitation_id AND user_id = auth.uid())
);
-- Public can insert (RSVP) and read their own
CREATE POLICY "Anyone can RSVP" ON public.invitation_guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view guests of invitation" ON public.invitation_guests FOR SELECT USING (true);

-- Enable realtime for invitations
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitation_guests;

-- Updated_at triggers
CREATE TRIGGER update_shopping_list_items_updated_at BEFORE UPDATE ON public.shopping_list_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shabbat_invitations_updated_at BEFORE UPDATE ON public.shabbat_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitation_guests_updated_at BEFORE UPDATE ON public.invitation_guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
