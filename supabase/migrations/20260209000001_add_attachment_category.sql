-- Add category field to project_attachments to distinguish Step 3 vs Step 4 attachments
ALTER TABLE public.project_attachments
ADD COLUMN category text DEFAULT 'general';
