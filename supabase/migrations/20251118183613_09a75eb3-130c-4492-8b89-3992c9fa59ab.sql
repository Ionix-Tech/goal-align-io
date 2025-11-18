-- FASE 1: Estrutura de Dados - Separação Projeto x Plano de Ação

-- 1.1 Criar enum initiative_type
CREATE TYPE initiative_type AS ENUM ('idea', 'project', 'action_plan');

-- 1.2 Adicionar colunas à tabela projects
ALTER TABLE public.projects 
ADD COLUMN initiative_type initiative_type;

-- Adicionar campos 5W2H para Planos de Ação
ALTER TABLE public.projects
ADD COLUMN what TEXT,
ADD COLUMN why TEXT,
ADD COLUMN who TEXT,
ADD COLUMN where_location TEXT,
ADD COLUMN when_start DATE,
ADD COLUMN when_end DATE,
ADD COLUMN how TEXT,
ADD COLUMN how_much TEXT;

-- 1.3 Criar índice para performance
CREATE INDEX idx_projects_initiative_type ON projects(initiative_type);

-- 1.4 Migração de dados existentes
-- Marcar ideias como 'idea' e projetos existentes como 'project'
UPDATE projects 
SET initiative_type = CASE 
  WHEN status = 'idea' THEN 'idea'::initiative_type
  ELSE 'project'::initiative_type
END
WHERE initiative_type IS NULL;

-- 1.5 Tornar initiative_type obrigatório e definir default
ALTER TABLE public.projects 
ALTER COLUMN initiative_type SET NOT NULL;

ALTER TABLE public.projects 
ALTER COLUMN initiative_type SET DEFAULT 'project'::initiative_type;

-- Comentários para documentação
COMMENT ON COLUMN projects.initiative_type IS 'Tipo de iniciativa: idea (ideia rápida), project (projeto estruturado), action_plan (plano de ação enxuto)';
COMMENT ON COLUMN projects.what IS '5W2H - O quê será feito (para action_plan)';
COMMENT ON COLUMN projects.why IS '5W2H - Por quê (para action_plan)';
COMMENT ON COLUMN projects.who IS '5W2H - Quem é responsável (para action_plan)';
COMMENT ON COLUMN projects.where_location IS '5W2H - Onde será executado (para action_plan)';
COMMENT ON COLUMN projects.when_start IS '5W2H - Quando começa (para action_plan)';
COMMENT ON COLUMN projects.when_end IS '5W2H - Quando termina - prazo global (para action_plan)';
COMMENT ON COLUMN projects.how IS '5W2H - Como será executado (para action_plan)';
COMMENT ON COLUMN projects.how_much IS '5W2H - Quanto custa (para action_plan)';