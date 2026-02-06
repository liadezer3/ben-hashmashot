-- Create family_groups table
CREATE TABLE public.family_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_group_members table
CREATE TABLE public.family_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create shared_tasks table for family group checklists
CREATE TABLE public.shared_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID,
  completed_by_name TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_groups
CREATE POLICY "Users can view groups they belong to"
ON public.family_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_group_members
    WHERE group_id = family_groups.id AND user_id = auth.uid()
  )
  OR created_by = auth.uid()
);

CREATE POLICY "Authenticated users can create groups"
ON public.family_groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
ON public.family_groups FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Group creators can delete their groups"
ON public.family_groups FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for family_group_members
CREATE POLICY "Members can view other members in their groups"
ON public.family_group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_group_members AS m
    WHERE m.group_id = family_group_members.group_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups"
ON public.family_group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.family_group_members FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Group admins can remove members"
ON public.family_group_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.family_groups
    WHERE id = family_group_members.group_id AND created_by = auth.uid()
  )
);

-- RLS Policies for shared_tasks
CREATE POLICY "Members can view tasks in their groups"
ON public.shared_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_group_members
    WHERE group_id = shared_tasks.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can create tasks in their groups"
ON public.shared_tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_group_members
    WHERE group_id = shared_tasks.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can update tasks in their groups"
ON public.shared_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_group_members
    WHERE group_id = shared_tasks.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete tasks in their groups"
ON public.shared_tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.family_group_members
    WHERE group_id = shared_tasks.group_id AND user_id = auth.uid()
  )
);

-- Enable realtime for shared_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_tasks;

-- Create triggers for updated_at
CREATE TRIGGER update_family_groups_updated_at
BEFORE UPDATE ON public.family_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_tasks_updated_at
BEFORE UPDATE ON public.shared_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();