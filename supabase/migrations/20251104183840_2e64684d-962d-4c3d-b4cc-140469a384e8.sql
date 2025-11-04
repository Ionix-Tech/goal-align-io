-- Remover foreign keys antigas que apontam para auth.users
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_assigned_to_fkey;

-- Criar foreign keys corretas apontando para profiles
-- Isso permite o join correto no código
ALTER TABLE public.projects
ADD CONSTRAINT projects_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.projects
ADD CONSTRAINT projects_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;