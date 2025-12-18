-- Add source_idea_id to track which idea originated a project/action plan
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS source_idea_id uuid REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_source_idea ON projects(source_idea_id);

-- Fix existing ideas: set initiative_type to 'idea' for all records with status='idea'
UPDATE projects 
SET initiative_type = 'idea' 
WHERE status = 'idea' AND initiative_type != 'idea';