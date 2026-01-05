-- Create task_indicator_links table for many-to-many relationship between tasks and indicators
CREATE TABLE public.task_indicator_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES public.project_indicators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, indicator_id)
);

-- Enable RLS
ALTER TABLE public.task_indicator_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users with project access can manage task indicator links
CREATE POLICY "Users can view task indicator links"
ON public.task_indicator_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_tasks pt
    JOIN projects p ON p.id = pt.project_id
    WHERE pt.id = task_indicator_links.task_id
    AND public.user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Users can insert task indicator links"
ON public.task_indicator_links
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_tasks pt
    JOIN projects p ON p.id = pt.project_id
    WHERE pt.id = task_indicator_links.task_id
    AND public.user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Users can delete task indicator links"
ON public.task_indicator_links
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM project_tasks pt
    JOIN projects p ON p.id = pt.project_id
    WHERE pt.id = task_indicator_links.task_id
    AND public.user_has_project_access(auth.uid(), p.id)
  )
);