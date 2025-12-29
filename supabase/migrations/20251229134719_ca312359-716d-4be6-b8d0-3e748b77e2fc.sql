-- Drop the existing foreign key that references auth.users
ALTER TABLE public.project_comments DROP CONSTRAINT IF EXISTS project_comments_user_id_fkey;

-- Add new foreign key referencing public.profiles
ALTER TABLE public.project_comments
  ADD CONSTRAINT project_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;