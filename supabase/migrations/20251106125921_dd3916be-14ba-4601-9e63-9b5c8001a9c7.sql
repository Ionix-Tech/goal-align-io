-- Create situation_indicators table (indicators now belong to situations)
CREATE TABLE IF NOT EXISTS public.situation_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  situation_id uuid NOT NULL REFERENCES public.project_situations(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_value numeric NOT NULL,
  target_value numeric NOT NULL,
  unit text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_situation_indicators_situation_id ON public.situation_indicators(situation_id);

-- Enable RLS
ALTER TABLE public.situation_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for situation_indicators
CREATE POLICY "Users can view indicators of accessible situations"
  ON public.situation_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_indicators.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can manage indicators"
  ON public.situation_indicators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_indicators.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_indicators.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

-- Create situation_attachments table FIRST (before storage policies that reference it)
CREATE TABLE IF NOT EXISTS public.situation_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  situation_id uuid NOT NULL REFERENCES public.project_situations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_situation_attachments_situation_id ON public.situation_attachments(situation_id);

-- Enable RLS
ALTER TABLE public.situation_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for situation_attachments
CREATE POLICY "Users can view attachments of accessible situations"
  ON public.situation_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_attachments.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

CREATE POLICY "Project members can manage attachments"
  ON public.situation_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_attachments.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_situations ps
      JOIN public.projects p ON p.id = ps.project_id
      WHERE ps.id = situation_attachments.situation_id 
        AND user_has_project_access(auth.uid(), p.id)
    )
  );

-- NOW create storage bucket for project attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-attachments', 'project-attachments', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage bucket (NOW situation_attachments exists)
CREATE POLICY "Users can view attachments of accessible projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-attachments' AND
  EXISTS (
    SELECT 1 FROM public.situation_attachments sa
    JOIN public.project_situations ps ON ps.id = sa.situation_id
    JOIN public.projects p ON p.id = ps.project_id
    WHERE sa.file_path = name
      AND user_has_project_access(auth.uid(), p.id)
  )
);

CREATE POLICY "Project members can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Project members can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-attachments' AND
  EXISTS (
    SELECT 1 FROM public.situation_attachments sa
    JOIN public.project_situations ps ON ps.id = sa.situation_id
    JOIN public.projects p ON p.id = ps.project_id
    WHERE sa.file_path = name
      AND user_has_project_access(auth.uid(), p.id)
  )
);

-- Remove numeric fields from project_situations (now handled by situation_indicators)
ALTER TABLE public.project_situations 
  DROP COLUMN IF EXISTS numeric_current,
  DROP COLUMN IF EXISTS numeric_target,
  DROP COLUMN IF EXISTS unit;