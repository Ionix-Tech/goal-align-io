-- ============================================================================
-- COMPREHENSIVE SECURITY FIX: RLS POLICIES UPDATE
-- This migration fixes critical security vulnerabilities by replacing
-- overly permissive RLS policies with proper access control
-- ============================================================================

-- 1. FIX: project_comments - Restrict access to project members only
-- ============================================================================
DROP POLICY IF EXISTS "all_project_comments_all" ON public.project_comments;

CREATE POLICY "Users can view project comments"
ON public.project_comments FOR SELECT
TO authenticated
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create project comments"
ON public.project_comments FOR INSERT
TO authenticated
WITH CHECK (
  user_has_project_access(auth.uid(), project_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update own comments"
ON public.project_comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.project_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'ceo'::app_role));

-- 2. FIX: project_indicators - Restrict access to project members only
-- ============================================================================
DROP POLICY IF EXISTS "all_project_indicators_all" ON public.project_indicators;

CREATE POLICY "Users can view project indicators"
ON public.project_indicators FOR SELECT
TO authenticated
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create indicators"
ON public.project_indicators FOR INSERT
TO authenticated
WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can update indicators"
ON public.project_indicators FOR UPDATE
TO authenticated
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project managers can delete indicators"
ON public.project_indicators FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_id
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'ceo'::app_role))
  )
);

-- 3. FIX: project_milestones - Restrict access to project members only
-- ============================================================================
DROP POLICY IF EXISTS "all_project_milestones_all" ON public.project_milestones;

CREATE POLICY "Users can view project milestones"
ON public.project_milestones FOR SELECT
TO authenticated
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can create milestones"
ON public.project_milestones FOR INSERT
TO authenticated
WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can update milestones"
ON public.project_milestones FOR UPDATE
TO authenticated
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project managers can delete milestones"
ON public.project_milestones FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_id
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'ceo'::app_role))
  )
);

-- 4. FIX: project_members - Restrict membership management
-- ============================================================================
DROP POLICY IF EXISTS "all_project_members_all" ON public.project_members;

CREATE POLICY "Users can view project members"
ON public.project_members FOR SELECT
TO authenticated
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project managers can add members"
ON public.project_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_id
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role))
  )
);

CREATE POLICY "Project managers can remove members"
ON public.project_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_id
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role))
  )
);

-- 5. FIX: notifications - Only service role can create notifications
-- ============================================================================
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Service role can create notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- 6. FIX: profiles - Restrict profile visibility to project members
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view project member profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
  )
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE (p.created_by = auth.uid() AND profiles.id = p.assigned_to)
       OR (p.assigned_to = auth.uid() AND profiles.id = p.created_by)
  )
  OR has_role(auth.uid(), 'ceo'::app_role)
);

-- ============================================================================
-- SECURITY NOTES:
-- - All policies now properly check project access using user_has_project_access()
-- - Notification creation restricted to service role (must use Edge Functions)
-- - Profile visibility limited to users in shared projects
-- - CEOs maintain elevated access for administrative purposes
-- ============================================================================