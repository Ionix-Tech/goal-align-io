-- Add critical_reason column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS critical_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.critical_reason IS 'Justificativa do motivo pelo qual o projeto foi marcado como crítico';