-- Remover política antiga que não permite status 'review'
DROP POLICY IF EXISTS all_can_insert_projects ON public.projects;

-- Criar nova política permitindo 'idea', 'draft' E 'review'
CREATE POLICY all_can_insert_projects 
ON public.projects
FOR INSERT
WITH CHECK (
  (auth.uid() = created_by) 
  AND (status = ANY (ARRAY['idea'::project_status, 'draft'::project_status, 'review'::project_status]))
);