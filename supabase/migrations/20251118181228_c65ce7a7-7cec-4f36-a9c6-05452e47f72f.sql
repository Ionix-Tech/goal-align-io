-- FASE 1: Estrutura de Dados para Teses Estratégicas

-- Criar ENUM para tipos de tese
CREATE TYPE public.thesis_type AS ENUM (
  'operational_efficiency',
  'sales_expansion', 
  'new_business',
  'custom'
);

-- 1.1 Tabela principal de teses estratégicas
CREATE TABLE public.strategic_theses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT NOT NULL,
  year INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Tipo de template
  thesis_type public.thesis_type NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_theses_active ON strategic_theses(is_active, is_archived);
CREATE INDEX idx_theses_year ON strategic_theses(year);
CREATE INDEX idx_theses_type ON strategic_theses(thesis_type);
CREATE INDEX idx_theses_created_by ON strategic_theses(created_by);

-- 1.2 Tabela de KPIs principais da tese
CREATE TABLE public.thesis_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id UUID NOT NULL REFERENCES strategic_theses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  current_value NUMERIC,
  target_value NUMERIC NOT NULL,
  unit TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_thesis_kpis_thesis ON thesis_kpis(thesis_id);

-- 1.3 Tabela de campos específicos por tipo (template fields)
CREATE TABLE public.thesis_template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id UUID NOT NULL REFERENCES strategic_theses(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'select'
  field_value TEXT,
  options JSONB,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_template_fields_thesis ON thesis_template_fields(thesis_id);

-- 1.4 Adicionar thesis_id na tabela projects (nullable inicialmente para migração)
ALTER TABLE public.projects 
ADD COLUMN thesis_id UUID REFERENCES strategic_theses(id);

CREATE INDEX idx_projects_thesis ON projects(thesis_id);

-- 1.5 RLS Policies para strategic_theses
ALTER TABLE strategic_theses ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode visualizar teses ativas
CREATE POLICY "Authenticated users can view active theses"
ON strategic_theses FOR SELECT
USING (is_active = true AND is_archived = false);

-- CEO e PMO Manager podem criar/editar teses
CREATE POLICY "Managers can manage theses"
ON strategic_theses FOR ALL
USING (
  has_role(auth.uid(), 'ceo'::app_role) OR 
  has_role(auth.uid(), 'pmo_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'ceo'::app_role) OR 
  has_role(auth.uid(), 'pmo_manager'::app_role)
);

-- 1.6 RLS Policies para thesis_kpis
ALTER TABLE thesis_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KPIs of active theses"
ON thesis_kpis FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM strategic_theses 
    WHERE id = thesis_kpis.thesis_id 
    AND is_active = true
  )
);

CREATE POLICY "Managers can manage KPIs"
ON thesis_kpis FOR ALL
USING (
  has_role(auth.uid(), 'ceo'::app_role) OR 
  has_role(auth.uid(), 'pmo_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'ceo'::app_role) OR 
  has_role(auth.uid(), 'pmo_manager'::app_role)
);

-- 1.7 RLS Policies para thesis_template_fields
ALTER TABLE thesis_template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template fields of active theses"
ON thesis_template_fields FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM strategic_theses 
    WHERE id = thesis_template_fields.thesis_id 
    AND is_active = true
  )
);

CREATE POLICY "Managers can manage template fields"
ON thesis_template_fields FOR ALL
USING (
  has_role(auth.uid(), 'ceo'::app_role) OR 
  has_role(auth.uid(), 'pmo_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'ceo'::app_role) OR 
  has_role(auth.uid(), 'pmo_manager'::app_role)
);

-- 1.8 Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_strategic_theses_updated_at BEFORE UPDATE ON strategic_theses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thesis_kpis_updated_at BEFORE UPDATE ON thesis_kpis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FASE 6: Migração de dados existentes
-- Criar teses default baseadas nos strategic_pillars existentes
INSERT INTO strategic_theses (name, description, objective, year, period_start, period_end, thesis_type, created_by)
SELECT 
  'Eficiência Operacional 2025',
  'Otimizar processos, reduzir custos e aumentar produtividade operacional',
  'Alcançar excelência operacional através da redução de custos e otimização de processos',
  2025,
  '2025-01-01'::DATE,
  '2025-12-31'::DATE,
  'operational_efficiency'::thesis_type,
  id
FROM profiles 
WHERE id = 'c5d08749-e59e-4d6b-94fd-6a0d7651b182' -- Yendison (CEO)
LIMIT 1;

INSERT INTO strategic_theses (name, description, objective, year, period_start, period_end, thesis_type, created_by)
SELECT 
  'Expansão de Vendas 2025',
  'Aumentar market share e receita através de expansão comercial',
  'Crescer receita e base de clientes em mercados estratégicos',
  2025,
  '2025-01-01'::DATE,
  '2025-12-31'::DATE,
  'sales_expansion'::thesis_type,
  id
FROM profiles 
WHERE id = 'c5d08749-e59e-4d6b-94fd-6a0d7651b182'
LIMIT 1;

INSERT INTO strategic_theses (name, description, objective, year, period_start, period_end, thesis_type, created_by)
SELECT 
  'Novos Negócios 2025',
  'Explorar novos mercados, produtos e oportunidades de negócio',
  'Diversificar portfólio e criar novas fontes de receita',
  2025,
  '2025-01-01'::DATE,
  '2025-12-31'::DATE,
  'new_business'::thesis_type,
  id
FROM profiles 
WHERE id = 'c5d08749-e59e-4d6b-94fd-6a0d7651b182'
LIMIT 1;

-- Vincular projetos existentes às teses baseado em strategic_pillar
UPDATE projects p
SET thesis_id = (
  SELECT id FROM strategic_theses 
  WHERE CASE p.strategic_pillar
    WHEN 'operational_efficiency' THEN thesis_type = 'operational_efficiency'::thesis_type
    WHEN 'sales_expansion' THEN thesis_type = 'sales_expansion'::thesis_type
    WHEN 'new_business' THEN thesis_type = 'new_business'::thesis_type
    ELSE false
  END
  AND year = 2025
  LIMIT 1
)
WHERE strategic_pillar IS NOT NULL;