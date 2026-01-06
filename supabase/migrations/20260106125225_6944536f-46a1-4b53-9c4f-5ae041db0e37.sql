-- Add is_critical column to projects table
ALTER TABLE public.projects 
ADD COLUMN is_critical boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.is_critical IS 'Indicates if the project is critical/strategic for the company';