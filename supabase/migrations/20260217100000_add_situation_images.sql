-- Add image paths for AS-IS (current) and TO-BE (target) to project_situations
-- Images are stored in Supabase storage (project-attachments bucket)

ALTER TABLE public.project_situations
  ADD COLUMN IF NOT EXISTS current_image_path TEXT,
  ADD COLUMN IF NOT EXISTS target_image_path TEXT;
