-- Expandir tipos de status na tabela project_tasks
ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_status_check;
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_status_check 
  CHECK (status IN ('not_started', 'in_progress', 'blocked', 'review', 'paused', 'completed'));

-- Criar tabela task_status_history
CREATE TABLE IF NOT EXISTS public.task_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  notes text,
  changed_by uuid NOT NULL REFERENCES public.profiles(id),
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT task_status_history_status_check 
    CHECK (old_status IN ('not_started', 'in_progress', 'blocked', 'review', 'paused', 'completed') 
           AND new_status IN ('not_started', 'in_progress', 'blocked', 'review', 'paused', 'completed'))
);

-- Índices para performance
CREATE INDEX idx_task_status_history_task_id ON public.task_status_history(task_id);
CREATE INDEX idx_task_status_history_changed_at ON public.task_status_history(changed_at DESC);

-- RLS Policies
ALTER TABLE public.task_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history of accessible tasks"
  ON public.task_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_tasks pt
      JOIN public.projects p ON p.id = pt.project_id
      WHERE pt.id = task_status_history.task_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can create status history"
  ON public.task_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_tasks pt
      JOIN public.projects p ON p.id = pt.project_id
      WHERE pt.id = task_status_history.task_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );