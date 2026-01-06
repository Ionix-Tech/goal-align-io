-- Add AI analysis columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_impact_score integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_effort_score integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_category_suggestion text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_analysis_summary text;

-- Add comments for documentation
COMMENT ON COLUMN projects.ai_impact_score IS 'AI-generated impact score (1-5)';
COMMENT ON COLUMN projects.ai_effort_score IS 'AI-generated effort score (1-5)';
COMMENT ON COLUMN projects.ai_category_suggestion IS 'AI-suggested category for the idea';
COMMENT ON COLUMN projects.ai_analysis_summary IS 'AI-generated summary of the analysis';