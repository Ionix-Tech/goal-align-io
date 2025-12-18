-- Add start_date and link_url columns to project_tasks
ALTER TABLE public.project_tasks 
ADD COLUMN start_date date NULL,
ADD COLUMN link_url text NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_start_date ON public.project_tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON public.project_tasks(due_date);