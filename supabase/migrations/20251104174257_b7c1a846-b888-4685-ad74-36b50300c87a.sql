-- Fix infinite recursion in RLS policies

-- Step 1: Create security definer function to check project access
CREATE OR REPLACE FUNCTION public.user_has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id
    AND (
      created_by = _user_id 
      OR assigned_to = _user_id
      OR EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_id = _project_id AND user_id = _user_id
      )
    )
  ) OR public.has_role(_user_id, 'ceo'::app_role);
$$;

-- Step 2: Recreate projects table policies (non-recursive)

-- Drop existing policies
DROP POLICY IF EXISTS "CEOs can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;
DROP POLICY IF EXISTS "CEOs can update projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;

-- Create new consolidated SELECT policy (non-recursive)
CREATE POLICY "Users can view their accessible projects"
ON public.projects FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'ceo'::app_role)
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = projects.id AND user_id = auth.uid()
  )
);

-- Create new consolidated UPDATE policy
CREATE POLICY "Users can update their projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'ceo'::app_role)
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'ceo'::app_role)
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
);

-- Step 3: Update related tables policies

-- PROJECT_INDICATORS
DROP POLICY IF EXISTS "Users can view indicators of their projects" ON public.project_indicators;
DROP POLICY IF EXISTS "Managers can manage indicators" ON public.project_indicators;

CREATE POLICY "Users can view project indicators"
ON public.project_indicators FOR SELECT
TO authenticated
USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Managers can manage project indicators"
ON public.project_indicators FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'ceo'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND assigned_to = auth.uid()
  )
);

-- PROJECT_MILESTONES
DROP POLICY IF EXISTS "Users can view milestones of their projects" ON public.project_milestones;
DROP POLICY IF EXISTS "Managers can manage milestones" ON public.project_milestones;

CREATE POLICY "Users can view project milestones"
ON public.project_milestones FOR SELECT
TO authenticated
USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Managers can manage project milestones"
ON public.project_milestones FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'ceo'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND assigned_to = auth.uid()
  )
);

-- PROJECT_COMMENTS
DROP POLICY IF EXISTS "Users can view comments on their projects" ON public.project_comments;
DROP POLICY IF EXISTS "Users can add comments to their projects" ON public.project_comments;

CREATE POLICY "Users can view project comments"
ON public.project_comments FOR SELECT
TO authenticated
USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can add project comments"
ON public.project_comments FOR INSERT
TO authenticated
WITH CHECK (public.user_has_project_access(auth.uid(), project_id));

-- Step 4: Ensure user is CEO
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'ceo'::app_role
FROM auth.users
WHERE email = 'vinicius@ionixtech.com.br'
ON CONFLICT (user_id, role) DO NOTHING;