-- Simplificar RLS: todos podem tudo EXCETO aprovar
-- Zerar policies recursivas e recriar simples

-- PROJECTS: limpar todas
DROP POLICY IF EXISTS "Authenticated users can create ideas and projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their accessible projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their projects" ON public.projects;
DROP POLICY IF EXISTS "all_can_select_projects" ON public.projects;
DROP POLICY IF EXISTS "all_can_insert_projects" ON public.projects;
DROP POLICY IF EXISTS "all_can_update_projects_except_approve" ON public.projects;
DROP POLICY IF EXISTS "approvers_can_approve" ON public.projects;
DROP POLICY IF EXISTS "all_can_delete_projects" ON public.projects;

-- PROJECT MEMBERS: limpar
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "CEOs and managers can add members" ON public.project_members;
DROP POLICY IF EXISTS "CEOs and managers can remove members" ON public.project_members;
DROP POLICY IF EXISTS "all_project_members_all" ON public.project_members;

-- INDICATORS: limpar
DROP POLICY IF EXISTS "Users can view project indicators" ON public.project_indicators;
DROP POLICY IF EXISTS "Managers can manage project indicators" ON public.project_indicators;
DROP POLICY IF EXISTS "all_project_indicators_all" ON public.project_indicators;

-- MILESTONES: limpar
DROP POLICY IF EXISTS "Users can view project milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Managers can manage project milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "all_project_milestones_all" ON public.project_milestones;

-- COMMENTS: limpar
DROP POLICY IF EXISTS "Users can view project comments" ON public.project_comments;
DROP POLICY IF EXISTS "Users can add project comments" ON public.project_comments;
DROP POLICY IF EXISTS "all_project_comments_all" ON public.project_comments;

-- Recriar policies SIMPLES e NÃO RECURSIVAS
-- PROJECTS
CREATE POLICY "all_can_select_projects"
ON public.projects FOR SELECT TO authenticated
USING (true);

CREATE POLICY "all_can_insert_projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND status = ANY (ARRAY['idea'::project_status, 'draft'::project_status]));

-- Todo mundo pode atualizar, EXCETO aprovar
CREATE POLICY "all_can_update_projects_except_approve"
ON public.projects FOR UPDATE TO authenticated
USING (true)
WITH CHECK (
  (status IS DISTINCT FROM 'approved'::project_status)
  AND approved_by IS NULL
  AND approved_at IS NULL
);

-- Apenas CEO/PMO podem aprovar
CREATE POLICY "approvers_can_approve"
ON public.projects FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'ceo'::app_role) OR public.has_role(auth.uid(), 'pmo_manager'::app_role))
WITH CHECK (true);

CREATE POLICY "all_can_delete_projects"
ON public.projects FOR DELETE TO authenticated
USING (true);

-- RELATED TABLES TOTALMENTE ABERTAS
CREATE POLICY "all_project_members_all"
ON public.project_members FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "all_project_indicators_all"
ON public.project_indicators FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "all_project_milestones_all"
ON public.project_milestones FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "all_project_comments_all"
ON public.project_comments FOR ALL TO authenticated
USING (true) WITH CHECK (true);