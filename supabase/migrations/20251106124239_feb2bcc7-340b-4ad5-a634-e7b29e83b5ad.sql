-- 1. Add requirements column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS requirements text;

-- 2. Create project_situations table
CREATE TABLE IF NOT EXISTS public.project_situations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  current_problem text NOT NULL,
  target_goal text NOT NULL,
  numeric_current numeric,
  numeric_target numeric,
  unit text,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_situations_project_id ON public.project_situations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_situations_display_order ON public.project_situations(display_order);

-- Enable RLS
ALTER TABLE public.project_situations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_situations
CREATE POLICY "Users can view situations of accessible projects"
  ON public.project_situations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_situations.project_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can create situations"
  ON public.project_situations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_situations.project_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can update situations"
  ON public.project_situations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_situations.project_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can delete situations"
  ON public.project_situations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_situations.project_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

-- 3. Create situation_tasks table (link situations to tasks)
CREATE TABLE IF NOT EXISTS public.situation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  situation_id uuid NOT NULL REFERENCES public.project_situations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(situation_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_situation_tasks_situation_id ON public.situation_tasks(situation_id);
CREATE INDEX IF NOT EXISTS idx_situation_tasks_task_id ON public.situation_tasks(task_id);

-- Enable RLS
ALTER TABLE public.situation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for situation_tasks
CREATE POLICY "Users can view situation_tasks of accessible projects"
  ON public.situation_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_tasks.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can manage situation_tasks"
  ON public.situation_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_tasks.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_tasks.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );