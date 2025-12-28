-- Create milestone_type enum
CREATE TYPE public.milestone_type AS ENUM ('decolagem', 'voo', 'escala');

-- Create project_requirements table
CREATE TABLE public.project_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- R1, R2, R3...
  description TEXT NOT NULL, -- O que precisa melhorar
  indicator_name TEXT NOT NULL, -- Nome do indicador
  unit TEXT, -- Unidade de medida
  current_value NUMERIC, -- Valor atual (preenchido na Etapa 3)
  target_value NUMERIC, -- Meta (preenchido na Etapa 4)
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create requirement_task_links table (N:N correlation)
CREATE TABLE public.requirement_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.project_requirements(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requirement_id, task_id)
);

-- Add new columns to projects table
ALTER TABLE public.projects 
  ADD COLUMN current_situation_description TEXT,
  ADD COLUMN target_situation_description TEXT,
  ADD COLUMN current_step INTEGER DEFAULT 1,
  ADD COLUMN strategic_indicator TEXT;

-- Add milestone_type to project_milestones
ALTER TABLE public.project_milestones 
  ADD COLUMN milestone_type public.milestone_type;

-- Enable RLS on new tables
ALTER TABLE public.project_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_task_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_requirements
CREATE POLICY "Users can view requirements of accessible projects"
ON public.project_requirements
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create requirements"
ON public.project_requirements
FOR INSERT
WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can update requirements"
ON public.project_requirements
FOR UPDATE
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can delete requirements"
ON public.project_requirements
FOR DELETE
USING (user_has_project_access(auth.uid(), project_id));

-- RLS Policies for requirement_task_links
CREATE POLICY "Users can view requirement links of accessible projects"
ON public.requirement_task_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_requirements pr
    JOIN public.projects p ON p.id = pr.project_id
    WHERE pr.id = requirement_task_links.requirement_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Project members can create requirement links"
ON public.requirement_task_links
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_requirements pr
    JOIN public.projects p ON p.id = pr.project_id
    WHERE pr.id = requirement_task_links.requirement_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Project members can delete requirement links"
ON public.requirement_task_links
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_requirements pr
    JOIN public.projects p ON p.id = pr.project_id
    WHERE pr.id = requirement_task_links.requirement_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

-- Create trigger for updated_at on project_requirements
CREATE TRIGGER update_project_requirements_updated_at
BEFORE UPDATE ON public.project_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();