-- Create table for Shabbat preparation tasks
CREATE TABLE public.shabbat_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for family memories and recipes
CREATE TABLE public.family_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('memory', 'recipe')),
  title TEXT NOT NULL,
  content TEXT,
  date DATE,
  parsha TEXT,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shabbat_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_memories ENABLE ROW LEVEL SECURITY;

-- Shabbat tasks policies
CREATE POLICY "Users can view their own tasks" ON public.shabbat_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.shabbat_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.shabbat_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.shabbat_tasks FOR DELETE USING (auth.uid() = user_id);

-- Family memories policies
CREATE POLICY "Users can view their own memories" ON public.family_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own memories" ON public.family_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memories" ON public.family_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memories" ON public.family_memories FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_shabbat_tasks_updated_at BEFORE UPDATE ON public.shabbat_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_memories_updated_at BEFORE UPDATE ON public.family_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();