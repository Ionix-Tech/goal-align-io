-- Create table for N:N relationship between projects and thesis KPIs
CREATE TABLE public.project_strategic_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES public.thesis_kpis(id) ON DELETE CASCADE,
  kpi_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, kpi_id)
);

-- Enable RLS
ALTER TABLE public.project_strategic_kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view strategic kpis of accessible projects"
ON public.project_strategic_kpis
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can add strategic kpis"
ON public.project_strategic_kpis
FOR INSERT
WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can remove strategic kpis"
ON public.project_strategic_kpis
FOR DELETE
USING (user_has_project_access(auth.uid(), project_id));

-- Migrate existing data from strategic_indicator field
INSERT INTO public.project_strategic_kpis (project_id, kpi_id, kpi_name)
SELECT 
  p.id as project_id,
  tk.id as kpi_id,
  tk.name as kpi_name
FROM public.projects p
JOIN public.thesis_kpis tk ON tk.name = p.strategic_indicator
WHERE p.strategic_indicator IS NOT NULL 
  AND p.strategic_indicator != ''
  AND tk.id IS NOT NULL
ON CONFLICT DO NOTHING;