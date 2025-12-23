-- Create table for storing Why reference links
CREATE TABLE public.project_why_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE public.project_why_links 
ADD CONSTRAINT project_why_links_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.project_why_links ENABLE ROW LEVEL SECURITY;

-- RLS policies using existing security definer function
CREATE POLICY "Users can view why links of accessible projects"
ON public.project_why_links
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create why links"
ON public.project_why_links
FOR INSERT
WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can delete why links"
ON public.project_why_links
FOR DELETE
USING (user_has_project_access(auth.uid(), project_id));