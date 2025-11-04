-- Dropar políticas que dependem da coluna status
DROP POLICY IF EXISTS "Managers can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create ideas and projects" ON public.projects;

-- Criar o novo enum simplificado
CREATE TYPE public.project_status_new AS ENUM ('idea', 'draft', 'review', 'approved', 'archived');

-- Adicionar coluna temporária com o novo enum
ALTER TABLE public.projects ADD COLUMN status_new public.project_status_new;

-- Migrar dados para a nova coluna
UPDATE public.projects
SET status_new = CASE 
  WHEN status::text = 'idea' THEN 'idea'::project_status_new
  WHEN status::text = 'draft' THEN 'draft'::project_status_new
  WHEN status::text = 'pending_approval' THEN 'review'::project_status_new
  WHEN status::text = 'rejected' THEN 'draft'::project_status_new
  WHEN status::text = 'review' THEN 'review'::project_status_new
  WHEN status::text = 'approved' THEN 'approved'::project_status_new
  WHEN status::text = 'in_progress' THEN 'approved'::project_status_new
  WHEN status::text = 'completed' THEN 'approved'::project_status_new
  WHEN status::text = 'archived' THEN 'archived'::project_status_new
  ELSE 'draft'::project_status_new
END;

-- Dropar a coluna antiga
ALTER TABLE public.projects DROP COLUMN status;

-- Renomear a nova coluna
ALTER TABLE public.projects RENAME COLUMN status_new TO status;

-- Definir default e NOT NULL
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'idea'::project_status_new;
ALTER TABLE public.projects ALTER COLUMN status SET NOT NULL;

-- Dropar o enum antigo
DROP TYPE public.project_status;

-- Renomear o novo enum
ALTER TYPE public.project_status_new RENAME TO project_status;

-- Recriar as políticas RLS atualizadas
CREATE POLICY "Authenticated users can create ideas and projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND status IN ('idea', 'draft')
);

CREATE POLICY "Managers can update their projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'pmo_manager'::app_role) 
  AND assigned_to = auth.uid() 
  AND status IN ('idea', 'draft', 'review')
);

-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'project_submitted',
    'project_approved', 
    'project_rejected',
    'revision_requested'
  )),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de notificações
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Índices para melhorar performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read) WHERE read = false;