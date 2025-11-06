-- Create project_situations table for "Situação Atual vs Situação Alvo"
CREATE TABLE IF NOT EXISTS public.project_situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  current_problem TEXT NOT NULL,
  target_goal TEXT NOT NULL,
  numeric_current DECIMAL,
  numeric_target DECIMAL,
  unit TEXT,
  display_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table to link situations with tasks
CREATE TABLE IF NOT EXISTS public.situation_tasks (
  situation_id UUID NOT NULL REFERENCES public.project_situations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (situation_id, task_id)
);

-- Enable RLS
ALTER TABLE public.project_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.situation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_situations
CREATE POLICY "Users can view situations of accessible projects"
  ON public.project_situations FOR SELECT
  USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create situations"
  ON public.project_situations FOR INSERT
  WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can update situations"
  ON public.project_situations FOR UPDATE
  USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project managers can delete situations"
  ON public.project_situations FOR DELETE
  USING (
    user_has_project_access(auth.uid(), project_id)
    AND (
      has_role(auth.uid(), 'ceo'::app_role)
      OR has_role(auth.uid(), 'pmo_manager'::app_role)
      OR created_by = auth.uid()
    )
  );

-- RLS Policies for situation_tasks
CREATE POLICY "Users can view situation_tasks of accessible projects"
  ON public.situation_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      WHERE ps.id = situation_id
      AND user_has_project_access(auth.uid(), ps.project_id)
    )
  );

CREATE POLICY "Project members can manage situation_tasks"
  ON public.situation_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      WHERE ps.id = situation_id
      AND user_has_project_access(auth.uid(), ps.project_id)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_situations_project_id ON public.project_situations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_situations_display_order ON public.project_situations(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_situation_tasks_situation_id ON public.situation_tasks(situation_id);
CREATE INDEX IF NOT EXISTS idx_situation_tasks_task_id ON public.situation_tasks(task_id);

-- Add comments
COMMENT ON TABLE public.project_situations IS 'Mapeamento de problemas atuais vs metas - metodologia A3';
COMMENT ON COLUMN public.project_situations.current_problem IS 'Descrição do problema/situação atual';
COMMENT ON COLUMN public.project_situations.target_goal IS 'Descrição da meta/situação desejada';
COMMENT ON COLUMN public.project_situations.numeric_current IS 'Valor numérico atual (opcional)';
COMMENT ON COLUMN public.project_situations.numeric_target IS 'Valor numérico alvo (opcional)';
