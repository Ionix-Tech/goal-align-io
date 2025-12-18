-- Create junction table for linking multiple ideas to projects
CREATE TABLE public.project_source_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.profiles(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(project_id, idea_id),
  -- Ensure idea_id is actually an idea
  CONSTRAINT idea_must_be_idea CHECK (idea_id != project_id)
);

-- Enable RLS
ALTER TABLE public.project_source_ideas ENABLE ROW LEVEL SECURITY;

-- Users can view linked ideas of accessible projects
CREATE POLICY "Users can view linked ideas"
ON public.project_source_ideas
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

-- Project members can link ideas
CREATE POLICY "Project members can link ideas"
ON public.project_source_ideas
FOR INSERT
WITH CHECK (user_has_project_access(auth.uid(), project_id) AND added_by = auth.uid());

-- Managers and the person who added can unlink
CREATE POLICY "Managers and adders can unlink ideas"
ON public.project_source_ideas
FOR DELETE
USING (
  has_role(auth.uid(), 'ceo'::app_role) OR 
  has_role(auth.uid(), 'pmo_manager'::app_role) OR
  added_by = auth.uid()
);

-- Create index for faster queries
CREATE INDEX idx_project_source_ideas_project_id ON public.project_source_ideas(project_id);
CREATE INDEX idx_project_source_ideas_idea_id ON public.project_source_ideas(idea_id);

-- Migrate existing source_idea_id data to the new table
-- This will only work if there are existing profiles, so we use a safe approach
INSERT INTO public.project_source_ideas (project_id, idea_id, added_by, added_at, notes)
SELECT 
  p.id as project_id,
  p.source_idea_id as idea_id,
  p.created_by as added_by,
  COALESCE(p.created_at, now()) as added_at,
  'Migrado automaticamente da ideia original' as notes
FROM public.projects p
WHERE p.source_idea_id IS NOT NULL
AND EXISTS (SELECT 1 FROM public.profiles WHERE id = p.created_by)
ON CONFLICT (project_id, idea_id) DO NOTHING;