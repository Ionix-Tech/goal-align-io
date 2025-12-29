-- Make indicator_name nullable (it will be optional now)
ALTER TABLE project_requirements 
  ALTER COLUMN indicator_name DROP NOT NULL;

-- Create table for linking requirements to indicators (many-to-many)
CREATE TABLE requirement_indicator_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES project_indicators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(requirement_id, indicator_id)
);

-- Enable RLS
ALTER TABLE requirement_indicator_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies (similar to requirement_task_links)
CREATE POLICY "Users can view requirement indicator links of accessible projects" 
ON requirement_indicator_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM project_requirements pr
    JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = requirement_indicator_links.requirement_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Project members can create requirement indicator links" 
ON requirement_indicator_links 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_requirements pr
    JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = requirement_indicator_links.requirement_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Project members can delete requirement indicator links" 
ON requirement_indicator_links 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM project_requirements pr
    JOIN projects p ON p.id = pr.project_id
    WHERE pr.id = requirement_indicator_links.requirement_id
    AND user_has_project_access(auth.uid(), p.id)
  )
);