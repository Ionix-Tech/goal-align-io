-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('ceo', 'pmo_manager', 'project_member');

-- Enum para status de projeto
CREATE TYPE public.project_status AS ENUM (
  'idea',           -- Ideia criada pelo CEO
  'draft',          -- Gestor estruturando
  'review',         -- Aguardando aprovação CEO
  'approved',       -- Aprovado, pronto para execução
  'in_progress',    -- Em execução
  'completed',      -- Concluído
  'archived'        -- Arquivado
);

-- Enum para pilares estratégicos
CREATE TYPE public.strategic_pillar AS ENUM (
  'operational_efficiency',
  'sales_expansion', 
  'new_business'
);

-- Tabela de perfis (extende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de roles (SEPARADA por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Função security definer para checar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela principal de projetos
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campos básicos
  name TEXT NOT NULL,
  description TEXT,
  
  -- Campos estruturados (A3)
  context TEXT,
  strategic_pillar strategic_pillar,
  objective TEXT,
  
  -- Relacionamentos
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Status e metadados
  status project_status DEFAULT 'idea' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  submitted_for_review_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Membros do projeto
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Indicadores
CREATE TABLE public.project_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  current_state TEXT NOT NULL,
  target_state TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Milestones
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários
CREATE TABLE public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de edições do CEO
CREATE TABLE public.project_edit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  edited_by UUID REFERENCES auth.users(id) NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  edited_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_assigned_to ON public.projects(assigned_to);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);

-- RLS Policies

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "CEOs can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'));

-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEOs can view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Managers can view assigned projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'pmo_manager') AND
    (created_by = auth.uid() OR assigned_to = auth.uid())
  );

CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "CEOs can create ideas"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'ceo') AND
    status = 'idea'
  );

CREATE POLICY "Managers can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'pmo_manager') AND
    status = 'draft'
  );

CREATE POLICY "CEOs can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Managers can update their projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'pmo_manager') AND
    assigned_to = auth.uid() AND
    status IN ('idea', 'draft')
  );

-- Project Members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project members"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'ceo') OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND (assigned_to = auth.uid() OR created_by = auth.uid())
    )
  );

CREATE POLICY "CEOs and managers can add members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'ceo') OR
    (public.has_role(auth.uid(), 'pmo_manager') AND
     EXISTS (
       SELECT 1 FROM public.projects
       WHERE id = project_id AND assigned_to = auth.uid()
     ))
  );

CREATE POLICY "CEOs and managers can remove members"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'ceo') OR
    (public.has_role(auth.uid(), 'pmo_manager') AND
     EXISTS (
       SELECT 1 FROM public.projects
       WHERE id = project_id AND assigned_to = auth.uid()
     ))
  );

-- Project Indicators
ALTER TABLE public.project_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view indicators of their projects"
  ON public.project_indicators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND (
        public.has_role(auth.uid(), 'ceo') OR
        assigned_to = auth.uid() OR
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Managers can manage indicators"
  ON public.project_indicators FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND assigned_to = auth.uid()
    )
  );

-- Project Milestones
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones of their projects"
  ON public.project_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND (
        public.has_role(auth.uid(), 'ceo') OR
        assigned_to = auth.uid() OR
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Managers can manage milestones"
  ON public.project_milestones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND assigned_to = auth.uid()
    )
  );

-- Project Comments
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their projects"
  ON public.project_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND (
        public.has_role(auth.uid(), 'ceo') OR
        assigned_to = auth.uid() OR
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can add comments to their projects"
  ON public.project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND (
        public.has_role(auth.uid(), 'ceo') OR
        assigned_to = auth.uid() OR
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
      )
    )
  );

-- Project Edit Log
ALTER TABLE public.project_edit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEOs can view edit logs"
  ON public.project_edit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEOs can create edit logs"
  ON public.project_edit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ceo'));