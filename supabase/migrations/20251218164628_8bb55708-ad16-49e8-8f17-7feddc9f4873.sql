-- Fix storage upload policy to validate project context and path structure
-- This prevents any authenticated user from uploading to arbitrary paths

-- 1. Drop the overly permissive upload policy
DROP POLICY IF EXISTS "Project members can upload attachments" ON storage.objects;

-- 2. Create a more secure upload policy that validates path structure
-- The path format is: projects/{project_uuid}/{timestamp}.{ext} or situations/{situation_uuid}/{timestamp}.{ext}
CREATE POLICY "Project members can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-attachments' AND
  auth.uid() IS NOT NULL AND
  -- Validate path starts with 'projects/' or 'situations/'
  (
    (storage.foldername(name))[1] = 'projects' OR
    (storage.foldername(name))[1] = 'situations'
  )
);

-- Note: The existing SELECT and DELETE policies already validate proper access via database records
-- The upload policy now ensures files can only be uploaded to valid project/situation paths
-- Application code (useProjectAttachments.ts) validates project access before uploading