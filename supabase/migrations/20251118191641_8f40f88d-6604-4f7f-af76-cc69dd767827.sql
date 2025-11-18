-- Tabela para armazenar anexos de projetos
CREATE TABLE IF NOT EXISTS public.project_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index para queries por projeto
CREATE INDEX idx_project_attachments_project_id ON public.project_attachments(project_id);

-- RLS Policies
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

-- Membros do projeto podem ver anexos
CREATE POLICY "Users can view attachments of accessible projects"
  ON public.project_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_attachments.project_id
      AND user_has_project_access(auth.uid(), p.id)
    )
  );

-- Membros do projeto podem adicionar anexos
CREATE POLICY "Project members can upload attachments"
  ON public.project_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_attachments.project_id
      AND user_has_project_access(auth.uid(), p.id)
    )
  );

-- Uploader ou gestor pode deletar anexos
CREATE POLICY "Uploaders and managers can delete attachments"
  ON public.project_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    has_role(auth.uid(), 'ceo'::app_role) OR
    has_role(auth.uid(), 'pmo_manager'::app_role)
  );