-- Adicionar campos para vincular tarefas a milestones e indicadores
ALTER TABLE public.project_tasks 
  ADD COLUMN milestone_id uuid REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  ADD COLUMN indicator_id uuid REFERENCES public.project_indicators(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX idx_project_tasks_milestone_id ON public.project_tasks(milestone_id);
CREATE INDEX idx_project_tasks_indicator_id ON public.project_tasks(indicator_id);

-- Adicionar campos name e unit aos indicadores para melhor rastreamento
ALTER TABLE public.project_indicators
  ADD COLUMN name text NOT NULL DEFAULT 'Indicador',
  ADD COLUMN unit text;

-- Adicionar campo description aos milestones
ALTER TABLE public.project_milestones
  ADD COLUMN description text;