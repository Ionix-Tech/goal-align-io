-- Create task_date_history table
CREATE TABLE public.task_date_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  old_date DATE,
  new_date DATE,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestone_date_history table
CREATE TABLE public.milestone_date_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
  old_date DATE,
  new_date DATE,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_date_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_date_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_date_history
CREATE POLICY "Users can view date history of accessible tasks"
ON public.task_date_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_tasks pt
    JOIN public.projects p ON p.id = pt.project_id
    WHERE pt.id = task_date_history.task_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Project members can create task date history"
ON public.task_date_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_tasks pt
    JOIN public.projects p ON p.id = pt.project_id
    WHERE pt.id = task_date_history.task_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

-- RLS Policies for milestone_date_history
CREATE POLICY "Users can view date history of accessible milestones"
ON public.milestone_date_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_milestones pm
    JOIN public.projects p ON p.id = pm.project_id
    WHERE pm.id = milestone_date_history.milestone_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Project members can create milestone date history"
ON public.milestone_date_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_milestones pm
    JOIN public.projects p ON p.id = pm.project_id
    WHERE pm.id = milestone_date_history.milestone_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

-- Create indexes for better performance
CREATE INDEX idx_task_date_history_task_id ON public.task_date_history(task_id);
CREATE INDEX idx_milestone_date_history_milestone_id ON public.milestone_date_history(milestone_id);