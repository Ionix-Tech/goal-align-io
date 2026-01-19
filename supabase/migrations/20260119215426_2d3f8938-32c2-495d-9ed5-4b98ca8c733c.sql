-- MIGRATION DE REPARO: Módulo de KPIs
-- Esta migration primeiro remove e depois recria todos os objetos
-- para garantir ordem correta durante a publicação

-- ===========================================
-- PARTE 1: LIMPEZA (ordem inversa de dependência)
-- ===========================================

-- 1.1 Remover triggers
DROP TRIGGER IF EXISTS trigger_kpi_control_requests_updated_at ON public.kpi_control_requests;
DROP TRIGGER IF EXISTS trigger_areas_updated_at ON public.areas;
DROP TRIGGER IF EXISTS trigger_kpis_updated_at ON public.kpis;
DROP TRIGGER IF EXISTS trigger_auto_generate_kpi_grid ON public.kpis;
DROP TRIGGER IF EXISTS trigger_calculate_kpi_status ON public.kpi_monthly_values;

-- 1.2 Remover funções
DROP FUNCTION IF EXISTS public.update_kpi_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.auto_generate_kpi_grid() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_kpi_status() CASCADE;
DROP FUNCTION IF EXISTS public.generate_kpi_monthly_grid(UUID, INTEGER) CASCADE;

-- 1.3 Remover tabelas (ordem de dependência)
DROP TABLE IF EXISTS public.kpi_control_requests CASCADE;
DROP TABLE IF EXISTS public.project_kpi_links CASCADE;
DROP TABLE IF EXISTS public.kpi_monthly_values CASCADE;
DROP TABLE IF EXISTS public.kpis CASCADE;
DROP TABLE IF EXISTS public.areas CASCADE;

-- 1.4 Remover ENUMs
DROP TYPE IF EXISTS public.kpi_request_status CASCADE;
DROP TYPE IF EXISTS public.kpi_status CASCADE;
DROP TYPE IF EXISTS public.kpi_target_type CASCADE;
DROP TYPE IF EXISTS public.kpi_direction CASCADE;
DROP TYPE IF EXISTS public.kpi_type CASCADE;

-- ===========================================
-- PARTE 2: RECRIAÇÃO (ordem correta)
-- ===========================================

-- 2.1 Criar ENUMs primeiro
CREATE TYPE public.kpi_type AS ENUM ('strategic', 'area', 'control');
CREATE TYPE public.kpi_direction AS ENUM ('higher_better', 'lower_better');
CREATE TYPE public.kpi_target_type AS ENUM ('fixed', 'variable');
CREATE TYPE public.kpi_status AS ENUM ('green', 'yellow', 'red');
CREATE TYPE public.kpi_request_status AS ENUM (
  'submitted', 'validating_pmo', 'awaiting_area', 
  'approved', 'returned', 'rejected'
);

-- 2.2 Criar tabela areas
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

-- 2.3 Criar tabela kpis
CREATE TABLE public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  kpi_type public.kpi_type NOT NULL,
  pillar_id UUID REFERENCES public.strategic_pillars(id),
  objective_id UUID REFERENCES public.strategic_theses(id),
  parent_kpi_id UUID REFERENCES public.kpis(id),
  area_id UUID REFERENCES public.areas(id),
  context_type TEXT CHECK (context_type IS NULL OR context_type IN ('area', 'strategic')),
  unit TEXT NOT NULL,
  direction public.kpi_direction NOT NULL DEFAULT 'higher_better',
  target_type public.kpi_target_type NOT NULL DEFAULT 'fixed',
  default_target NUMERIC,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
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

-- 2.4 Criar tabela kpi_monthly_values
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

-- 2.5 Criar tabela project_kpi_links
CREATE TABLE public.project_kpi_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  kpi_id UUID REFERENCES public.kpis(id) ON DELETE CASCADE NOT NULL,
  linked_by UUID REFERENCES public.profiles(id) NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(project_id, kpi_id)
);

-- 2.6 Criar tabela kpi_control_requests
CREATE TABLE public.kpi_control_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) NOT NULL,
  suggested_name TEXT NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('area', 'strategic')),
  area_id UUID REFERENCES public.areas(id),
  unit TEXT NOT NULL,
  direction public.kpi_direction NOT NULL,
  target_type public.kpi_target_type NOT NULL,
  suggested_owner_id UUID REFERENCES public.profiles(id),
  justification TEXT NOT NULL,
  status public.kpi_request_status NOT NULL DEFAULT 'submitted',
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  area_validated_by UUID REFERENCES public.profiles(id),
  area_validated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_kpi_id UUID REFERENCES public.kpis(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 Criar índices
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

-- 2.8 Habilitar RLS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_monthly_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_kpi_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_control_requests ENABLE ROW LEVEL SECURITY;

-- 2.9 Criar políticas RLS para areas
CREATE POLICY "areas_select_authenticated" ON public.areas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "areas_insert_managers" ON public.areas
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

CREATE POLICY "areas_update_managers" ON public.areas
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

CREATE POLICY "areas_delete_managers" ON public.areas
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

-- 2.10 Criar políticas RLS para kpis
CREATE POLICY "kpis_select_authenticated" ON public.kpis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "kpis_insert_managers" ON public.kpis
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

CREATE POLICY "kpis_update_managers" ON public.kpis
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

CREATE POLICY "kpis_delete_managers" ON public.kpis
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

-- 2.11 Criar políticas RLS para kpi_monthly_values
CREATE POLICY "kpi_monthly_values_select_authenticated" ON public.kpi_monthly_values
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "kpi_monthly_values_insert_managers" ON public.kpi_monthly_values
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

CREATE POLICY "kpi_monthly_values_update_managers" ON public.kpi_monthly_values
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

CREATE POLICY "kpi_monthly_values_delete_managers" ON public.kpi_monthly_values
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

-- 2.12 Criar políticas RLS para project_kpi_links
CREATE POLICY "project_kpi_links_select_authenticated" ON public.project_kpi_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "project_kpi_links_insert_authenticated" ON public.project_kpi_links
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "project_kpi_links_update_authenticated" ON public.project_kpi_links
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "project_kpi_links_delete_authenticated" ON public.project_kpi_links
  FOR DELETE TO authenticated USING (true);

-- 2.13 Criar políticas RLS para kpi_control_requests
CREATE POLICY "kpi_control_requests_select_authenticated" ON public.kpi_control_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "kpi_control_requests_insert_authenticated" ON public.kpi_control_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "kpi_control_requests_update_managers" ON public.kpi_control_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager') OR requested_by = auth.uid());

CREATE POLICY "kpi_control_requests_delete_managers" ON public.kpi_control_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'pmo_manager'));

-- 2.14 Criar função generate_kpi_monthly_grid
CREATE OR REPLACE FUNCTION public.generate_kpi_monthly_grid(p_kpi_id UUID, p_year INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_default_target NUMERIC;
  v_target_type public.kpi_target_type;
  v_month INTEGER;
BEGIN
  SELECT default_target, target_type INTO v_default_target, v_target_type
  FROM public.kpis WHERE id = p_kpi_id;
  
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

-- 2.15 Criar função calculate_kpi_status
CREATE OR REPLACE FUNCTION public.calculate_kpi_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_direction public.kpi_direction;
  v_achievement NUMERIC;
BEGIN
  IF NEW.target_value IS NULL OR NEW.target_value = 0 OR NEW.actual_value IS NULL THEN
    NEW.status := NULL;
    RETURN NEW;
  END IF;
  
  SELECT direction INTO v_direction FROM public.kpis WHERE id = NEW.kpi_id;
  
  v_achievement := (NEW.actual_value / NEW.target_value) * 100;
  
  IF v_direction = 'higher_better' THEN
    IF v_achievement >= 100 THEN
      NEW.status := 'green';
    ELSIF v_achievement >= 90 THEN
      NEW.status := 'yellow';
    ELSE
      NEW.status := 'red';
    END IF;
  ELSE
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

-- 2.16 Criar função auto_generate_kpi_grid
CREATE OR REPLACE FUNCTION public.auto_generate_kpi_grid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.generate_kpi_monthly_grid(NEW.id, NEW.year);
  RETURN NEW;
END;
$$;

-- 2.17 Criar função update_kpi_updated_at
CREATE OR REPLACE FUNCTION public.update_kpi_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2.18 Criar triggers
CREATE TRIGGER trigger_calculate_kpi_status
  BEFORE INSERT OR UPDATE ON public.kpi_monthly_values
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_kpi_status();

CREATE TRIGGER trigger_auto_generate_kpi_grid
  AFTER INSERT ON public.kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_kpi_grid();

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