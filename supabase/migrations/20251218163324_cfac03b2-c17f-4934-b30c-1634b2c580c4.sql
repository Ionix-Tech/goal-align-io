-- Fix overly permissive RLS policies on projects table

-- 1. Drop the dangerous policies
DROP POLICY IF EXISTS "all_can_select_projects" ON public.projects;
DROP POLICY IF EXISTS "all_can_delete_projects" ON public.projects;

-- 2. Create proper SELECT policy using existing user_has_project_access function
-- This ensures users can only see projects they have access to
CREATE POLICY "users_can_view_accessible_projects"
ON public.projects FOR SELECT TO authenticated
USING (
  user_has_project_access(auth.uid(), id)
);

-- 3. Create proper DELETE policy - only owners and managers can delete
CREATE POLICY "owners_and_managers_can_delete_projects"
ON public.projects FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'ceo'::app_role)
  OR has_role(auth.uid(), 'pmo_manager'::app_role)
  OR created_by = auth.uid()
);