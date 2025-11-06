-- Add requirements field to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Add task_number field for hierarchical numbering
ALTER TABLE public.project_tasks
ADD COLUMN IF NOT EXISTS task_number TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update task_status enum to include 'cancelled' status
-- Note: We can't modify enums directly in PostgreSQL, so we need to check the current definition
-- The 'overdue' status will be calculated dynamically, not stored
DO $$
BEGIN
  -- Check if 'cancelled' status doesn't exist, then add it
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'cancelled'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_status')
  ) THEN
    ALTER TYPE task_status ADD VALUE 'cancelled';
  END IF;
END $$;

-- Create index for task ordering
CREATE INDEX IF NOT EXISTS idx_project_tasks_display_order ON public.project_tasks(project_id, display_order);

-- Add comment to explain requirements field
COMMENT ON COLUMN public.projects.requirements IS 'Requisitos do projeto - lista os requisitos estratégicos que guiam todas as ações (ex: Aumentar capacidade de entrega, Melhorar qualidade de atendimento)';

-- Add comment to explain task_number field
COMMENT ON COLUMN public.project_tasks.task_number IS 'Numeração hierárquica da tarefa (ex: 1, 1.1, 1.2, 2, 3.1) para organização visual';
