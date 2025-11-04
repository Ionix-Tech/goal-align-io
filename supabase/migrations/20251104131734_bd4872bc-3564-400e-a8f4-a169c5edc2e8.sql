-- Remover políticas restritivas antigas
DROP POLICY IF EXISTS "CEOs can create ideas" ON public.projects;
DROP POLICY IF EXISTS "Managers can create projects" ON public.projects;

-- Nova política: Todos autenticados podem criar ideias e projetos
CREATE POLICY "Authenticated users can create ideas and projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND status IN ('idea', 'draft')
);

-- Nova política: Usuários podem atualizar projetos que criaram ou foram atribuídos
CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by 
  OR auth.uid() = assigned_to
)
WITH CHECK (
  auth.uid() = created_by 
  OR auth.uid() = assigned_to
);