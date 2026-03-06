-- Prevent infinite recursion in family group RLS by using security definer helpers
CREATE OR REPLACE FUNCTION public.is_family_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_family_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_groups
    WHERE id = _group_id
      AND created_by = _user_id
  )
$$;

REVOKE ALL ON FUNCTION public.is_family_group_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_family_group_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_family_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_family_group_admin(uuid, uuid) TO authenticated;

-- family_group_members policies
DROP POLICY IF EXISTS "Members can view other members in their groups" ON public.family_group_members;
CREATE POLICY "Members can view other members in their groups"
ON public.family_group_members
FOR SELECT
USING (public.is_family_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group admins can remove members" ON public.family_group_members;
CREATE POLICY "Group admins can remove members"
ON public.family_group_members
FOR DELETE
USING (public.is_family_group_admin(group_id, auth.uid()));

-- family_groups policy
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.family_groups;
CREATE POLICY "Users can view groups they belong to"
ON public.family_groups
FOR SELECT
USING (
  created_by = auth.uid()
  OR public.is_family_group_member(id, auth.uid())
);

-- shared_tasks policies
DROP POLICY IF EXISTS "Members can view tasks in their groups" ON public.shared_tasks;
CREATE POLICY "Members can view tasks in their groups"
ON public.shared_tasks
FOR SELECT
USING (public.is_family_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can create tasks in their groups" ON public.shared_tasks;
CREATE POLICY "Members can create tasks in their groups"
ON public.shared_tasks
FOR INSERT
WITH CHECK (public.is_family_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can update tasks in their groups" ON public.shared_tasks;
CREATE POLICY "Members can update tasks in their groups"
ON public.shared_tasks
FOR UPDATE
USING (public.is_family_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can delete tasks in their groups" ON public.shared_tasks;
CREATE POLICY "Members can delete tasks in their groups"
ON public.shared_tasks
FOR DELETE
USING (public.is_family_group_member(group_id, auth.uid()));

-- shopping_list_items policies
DROP POLICY IF EXISTS "Members can view shopping items" ON public.shopping_list_items;
CREATE POLICY "Members can view shopping items"
ON public.shopping_list_items
FOR SELECT
USING (public.is_family_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can add shopping items" ON public.shopping_list_items;
CREATE POLICY "Members can add shopping items"
ON public.shopping_list_items
FOR INSERT
WITH CHECK (public.is_family_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can update shopping items" ON public.shopping_list_items;
CREATE POLICY "Members can update shopping items"
ON public.shopping_list_items
FOR UPDATE
USING (public.is_family_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can delete shopping items" ON public.shopping_list_items;
CREATE POLICY "Members can delete shopping items"
ON public.shopping_list_items
FOR DELETE
USING (public.is_family_group_member(group_id, auth.uid()));