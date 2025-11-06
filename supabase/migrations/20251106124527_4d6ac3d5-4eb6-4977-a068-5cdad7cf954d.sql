-- Add requirements column to projects table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'requirements'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN requirements text;
  END IF;
END $$;