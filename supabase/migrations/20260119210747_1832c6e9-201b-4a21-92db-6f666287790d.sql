-- =============================================
-- MÓDULO DE KPIs COM GESTÃO MENSAL
-- Fase 1: Estrutura de Dados
-- =============================================

-- 1. Criar tabela de Áreas/Departamentos
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar ENUMs para KPIs
CREATE TYPE public.kpi_type AS ENUM ('strategic', 'area', 'control');
CREATE TYPE public.kpi_direction AS ENUM ('higher_better', 'lower_better');
CREATE TYPE public.kpi_target_type AS ENUM ('fixed', 'variable');
CREATE TYPE public.kpi_status AS ENUM ('green', 'yellow', 'red');
CREATE TYPE public.kpi_request_status AS ENUM (
  'submitted', 
  'validating_pmo', 
  'awaiting_area', 
  'approved', 
  'returned', 
  'rejected'
);

-- 3. Criar tabela principal de KPIs (unificada)
CREATE TABLE public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  kpi_type public.kpi_type NOT NULL,
  
  -- Hierarquia (para Estratégicos e de Área)
  pillar_id UUID REFERENCES public.strategic_pillars(id),
  objective_id UUID REFERENCES public.strategic_theses(id),
  parent_kpi_id UUID REFERENCES public.kpis(id),
  area_id UUID REFERENCES public.areas(id),
  
  -- Contexto para KPIs de Controle
  context_type TEXT CHECK (context_type IS NULL OR context_type IN ('area', 'strategic')),
  
  -- Configuração
  unit TEXT NOT NULL,
  direction public.kpi_direction NOT NULL DEFAULT 'higher_better',
  target_type public.kpi_target_type NOT NULL DEFAULT 'fixed',
  default_target NUMERIC,
  
  -- Responsável e período
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints de hierarquia
  CONSTRAINT strategic_requires_pillar_objective CHECK (
    kpi_type != 'strategic' OR (pillar_id IS NOT NULL AND objective_id IS NOT NULL)
  ),
  CONSTRAINT area_requires_parent_and_area CHECK (
    kpi_type != 'area' OR (parent_kpi_id IS NOT NULL AND area_id IS NOT NULL)
  ),
  CONSTRAINT control_requires_context CHECK (
    kpi_type != 'control' OR context_type IS NOT NULL
  )
);

-- 4. Criar tabela de valores mensais
CREATE TABLE public.kpi_monthly_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID REFERENCES public.kpis(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  target_value NUMERIC,
  actual_value NUMERIC,
  status public.kpi_status,
  notes TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(kpi_id, year, month)
);

-- 5. Criar tabela de vínculo Projeto-KPI
CREATE TABLE public.project_kpi_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  kpi_id UUID REFERENCES public.kpis(id) ON DELETE CASCADE NOT NULL,
  linked_by UUID REFERENCES public.profiles(id) NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  
  UNIQUE(project_id, kpi_id)
);

-- 6. Criar tabela de solicitações de KPI de Controle
CREATE TABLE public.kpi_control_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Dados sugeridos
  suggested_name TEXT NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('area', 'strategic')),
  area_id UUID REFERENCES public.areas(id),
  unit TEXT NOT NULL,
  direction public.kpi_direction NOT NULL,
  target_type public.kpi_target_type NOT NULL,
  suggested_owner_id UUID REFERENCES public.profiles(id),
  justification TEXT NOT NULL,
  
  -- Fluxo de aprovação
  status public.kpi_request_status NOT NULL DEFAULT 'submitted',
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  area_validated_by UUID REFERENCES public.profiles(id),
  area_validated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- KPI criado após aprovação
  created_kpi_id UUID REFERENCES public.kpis(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Criar índices para performance
CREATE INDEX idx_kpis_type ON public.kpis(kpi_type);
CREATE INDEX idx_kpis_pillar ON public.kpis(pillar_id);
CREATE INDEX idx_kpis_objective ON public.kpis(objective_id);
CREATE INDEX idx_kpis_area ON public.kpis(area_id);
CREATE INDEX idx_kpis_owner ON public.kpis(owner_id);
CREATE INDEX idx_kpis_year ON public.kpis(year);
CREATE INDEX idx_kpi_monthly_values_kpi ON public.kpi_monthly_values(kpi_id);
CREATE INDEX idx_kpi_monthly_values_year_month ON public.kpi_monthly_values(year, month);
CREATE INDEX idx_project_kpi_links_project ON public.project_kpi_links(project_id);
CREATE INDEX idx_project_kpi_links_kpi ON public.project_kpi_links(kpi_id);
CREATE INDEX idx_kpi_control_requests_project ON public.kpi_control_requests(project_id);
CREATE INDEX idx_kpi_control_requests_status ON public.kpi_control_requests(status);

-- 8. Habilitar RLS em todas as tabelas
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_monthly_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_kpi_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_control_requests ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para areas
CREATE POLICY "Authenticated users can view active areas"
  ON public.areas FOR SELECT
  USING (is_active = true);

CREATE POLICY "Managers can manage areas"
  ON public.areas FOR ALL
  USING (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'pmo_manager'))
  WITH CHECK (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'pmo_manager'));

-- 10. Políticas RLS para kpis
CREATE POLICY "Authenticated users can view active KPIs"
  ON public.kpis FOR SELECT
  USING (is_active = true);

CREATE POLICY "Managers can create KPIs"
  ON public.kpis FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'pmo_manager'));

CREATE POLICY "Managers and owners can update KPIs"
  ON public.kpis FOR UPDATE
  USING (
    has_role(auth.uid(), 'ceo') OR 
    has_role(auth.uid(), 'pmo_manager') OR 
    owner_id = auth.uid()
  );

CREATE POLICY "Managers can delete KPIs"
  ON public.kpis FOR DELETE
  USING (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'pmo_manager'));

-- 11. Políticas RLS para kpi_monthly_values
CREATE POLICY "Users can view KPI monthly values"
  ON public.kpi_monthly_values FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.kpis k WHERE k.id = kpi_id AND k.is_active = true
  ));

CREATE POLICY "Managers and owners can insert KPI values"
  ON public.kpi_monthly_values FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.kpis k 
    WHERE k.id = kpi_id 
    AND (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'pmo_manager') OR k.owner_id = auth.uid())
  ));

CREATE POLICY "Managers and owners can update KPI values"
  ON public.kpi_monthly_values FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.kpis k 
    WHERE k.id = kpi_id 
    AND (has_role(auth.uid(), 'ceo') OR has_role(auth.uid(), 'pmo_manager') OR k.owner_id = auth.uid())
  ));

-- 12. Políticas RLS para project_kpi_links
CREATE POLICY "Users can view project KPI links"
  ON public.project_kpi_links FOR SELECT
  USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Project members can link KPIs"
  ON public.project_kpi_links FOR INSERT
  WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Managers and linkers can unlink KPIs"
  ON public.project_kpi_links FOR DELETE
  USING (
    has_role(auth.uid(), 'ceo') OR 
    has_role(auth.uid(), 'pmo_manager') OR 
    linked_by = auth.uid()
  );

-- 13. Políticas RLS para kpi_control_requests
CREATE POLICY "Users can view own project requests"
  ON public.kpi_control_requests FOR SELECT
  USING (
    requested_by = auth.uid() OR
    user_has_project_access(auth.uid(), project_id) OR
    has_role(auth.uid(), 'ceo') OR 
    has_role(auth.uid(), 'pmo_manager')
  );

CREATE POLICY "Project members can create requests"
  ON public.kpi_control_requests FOR INSERT
  WITH CHECK (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Requesters can update pending requests"
  ON public.kpi_control_requests FOR UPDATE
  USING (
    (requested_by = auth.uid() AND status IN ('submitted', 'returned')) OR
    has_role(auth.uid(), 'ceo') OR 
    has_role(auth.uid(), 'pmo_manager')
  );

-- 14. Função para gerar grade mensal Jan-Dez
CREATE OR REPLACE FUNCTION public.generate_kpi_monthly_grid(p_kpi_id UUID, p_year INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_target NUMERIC;
  v_target_type public.kpi_target_type;
  v_month INTEGER;
BEGIN
  -- Buscar configuração do KPI
  SELECT default_target, target_type INTO v_default_target, v_target_type
  FROM public.kpis WHERE id = p_kpi_id;
  
  -- Gerar 12 meses
  FOR v_month IN 1..12 LOOP
    INSERT INTO public.kpi_monthly_values (kpi_id, year, month, target_value)
    VALUES (
      p_kpi_id, 
      p_year, 
      v_month, 
      CASE WHEN v_target_type = 'fixed' THEN v_default_target ELSE NULL END
    )
    ON CONFLICT (kpi_id, year, month) DO NOTHING;
  END LOOP;
END;
$$;

-- 15. Função para calcular status automaticamente
CREATE OR REPLACE FUNCTION public.calculate_kpi_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_direction public.kpi_direction;
  v_achievement NUMERIC;
BEGIN
  -- Se não tem valores, não calcula
  IF NEW.target_value IS NULL OR NEW.target_value = 0 OR NEW.actual_value IS NULL THEN
    NEW.status := NULL;
    RETURN NEW;
  END IF;
  
  -- Buscar direção do KPI
  SELECT direction INTO v_direction FROM public.kpis WHERE id = NEW.kpi_id;
  
  -- Calcular achievement
  v_achievement := (NEW.actual_value / NEW.target_value) * 100;
  
  -- Calcular status baseado na direção
  IF v_direction = 'higher_better' THEN
    IF v_achievement >= 100 THEN
      NEW.status := 'green';
    ELSIF v_achievement >= 90 THEN
      NEW.status := 'yellow';
    ELSE
      NEW.status := 'red';
    END IF;
  ELSE
    -- lower_better: inverter lógica
    IF v_achievement <= 100 THEN
      NEW.status := 'green';
    ELSIF v_achievement <= 110 THEN
      NEW.status := 'yellow';
    ELSE
      NEW.status := 'red';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 16. Trigger para calcular status automaticamente
CREATE TRIGGER trigger_calculate_kpi_status
  BEFORE INSERT OR UPDATE OF actual_value, target_value
  ON public.kpi_monthly_values
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_kpi_status();

-- 17. Trigger para gerar grade mensal ao criar KPI
CREATE OR REPLACE FUNCTION public.auto_generate_kpi_grid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.generate_kpi_monthly_grid(NEW.id, NEW.year);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_kpi_grid
  AFTER INSERT ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_kpi_grid();

-- 18. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_kpi_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_kpis_updated_at
  BEFORE UPDATE ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kpi_updated_at();

CREATE TRIGGER trigger_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kpi_updated_at();

CREATE TRIGGER trigger_kpi_control_requests_updated_at
  BEFORE UPDATE ON public.kpi_control_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kpi_updated_at();