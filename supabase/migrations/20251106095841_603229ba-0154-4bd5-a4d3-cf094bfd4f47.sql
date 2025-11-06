-- Create project_health_status table
CREATE TABLE IF NOT EXISTS public.project_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  health_status TEXT NOT NULL CHECK (health_status IN ('green', 'yellow', 'red')),
  reason TEXT,
  reported_by UUID NOT NULL REFERENCES public.profiles(id),
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create project_weekly_updates table
CREATE TABLE IF NOT EXISTS public.project_weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  health_status TEXT NOT NULL CHECK (health_status IN ('green', 'yellow', 'red')),
  progress_summary TEXT NOT NULL,
  challenges TEXT,
  next_steps TEXT,
  key_metrics JSONB,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_health_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_weekly_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_health_status
CREATE POLICY "Users can view health status of accessible projects"
  ON public.project_health_status FOR SELECT
  USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create health status"
  ON public.project_health_status FOR INSERT
  WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Managers can update health status"
  ON public.project_health_status FOR UPDATE
  USING (has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role));

-- RLS Policies for project_weekly_updates
CREATE POLICY "Users can view weekly updates of accessible projects"
  ON public.project_weekly_updates FOR SELECT
  USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create weekly updates"
  ON public.project_weekly_updates FOR INSERT
  WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Submitters can update their weekly updates"
  ON public.project_weekly_updates FOR UPDATE
  USING (submitted_by = auth.uid());

-- RLS Policies for project_tasks
CREATE POLICY "Users can view tasks of accessible projects"
  ON public.project_tasks FOR SELECT
  USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create tasks"
  ON public.project_tasks FOR INSERT
  WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Assigned users can update their tasks"
  ON public.project_tasks FOR UPDATE
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Task creators can delete tasks"
  ON public.project_tasks FOR DELETE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_health_status_project_id ON public.project_health_status(project_id);
CREATE INDEX IF NOT EXISTS idx_project_health_status_reported_at ON public.project_health_status(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_weekly_updates_project_id ON public.project_weekly_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_weekly_updates_submitted_at ON public.project_weekly_updates(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);