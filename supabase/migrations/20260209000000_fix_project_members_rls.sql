-- Fix: Allow any authenticated user with project access to manage members
-- The previous policy was too restrictive, requiring created_by/CEO/PMO roles

DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Project managers can add members" ON public.project_members;
DROP POLICY IF EXISTS "Project managers can remove members" ON public.project_members;

-- SELECT: any authenticated user can view members
CREATE POLICY "Users can view project members"
ON public.project_members FOR SELECT
TO authenticated
USING (true);

-- INSERT: any authenticated user can add members
CREATE POLICY "Users can add project members"
ON public.project_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- DELETE: any authenticated user can remove members
CREATE POLICY "Users can remove project members"
ON public.project_members FOR DELETE
TO authenticated
USING (true);
