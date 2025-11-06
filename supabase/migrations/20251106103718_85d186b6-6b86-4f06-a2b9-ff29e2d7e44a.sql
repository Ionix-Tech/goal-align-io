-- Create project_milestone_updates table
CREATE TABLE IF NOT EXISTS public.project_milestone_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
  progress_percentage INTEGER NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  is_critical BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_by UUID NOT NULL REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_indicator_updates table
CREATE TABLE IF NOT EXISTS public.project_indicator_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES public.project_indicators(id) ON DELETE CASCADE,
  measured_value TEXT NOT NULL,
  measurement_date DATE NOT NULL,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  updated_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_milestone_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_indicator_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_milestone_updates
CREATE POLICY "Users can view milestone updates of accessible projects"
  ON public.project_milestone_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_milestones pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.id = milestone_id
      AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can create milestone updates"
  ON public.project_milestone_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_milestones pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.id = milestone_id
      AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Updaters can modify their milestone updates"
  ON public.project_milestone_updates FOR UPDATE
  USING (updated_by = auth.uid());

-- RLS Policies for project_indicator_updates
CREATE POLICY "Users can view indicator updates of accessible projects"
  ON public.project_indicator_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_indicators pi
      JOIN public.projects p ON p.id = pi.project_id
      WHERE pi.id = indicator_id
      AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can create indicator updates"
  ON public.project_indicator_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_indicators pi
      JOIN public.projects p ON p.id = pi.project_id
      WHERE pi.id = indicator_id
      AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Updaters can modify their indicator updates"
  ON public.project_indicator_updates FOR UPDATE
  USING (updated_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_milestone_updates_milestone_id ON public.project_milestone_updates(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_updates_updated_at ON public.project_milestone_updates(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indicator_updates_indicator_id ON public.project_indicator_updates(indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_updates_measurement_date ON public.project_indicator_updates(measurement_date DESC);