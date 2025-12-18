-- Criar enum de categorias da Freitas
CREATE TYPE project_category AS ENUM (
  'productivity',      -- Produtividade
  'safety',           -- Segurança
  'customer',         -- Cliente
  'market',           -- Mercado
  'culture_team'      -- Cultura & Equipe
);

-- Adicionar coluna na tabela projects (nullable para ideias)
ALTER TABLE projects 
ADD COLUMN category project_category NULL;

-- Índice para performance em filtros/analytics
CREATE INDEX idx_projects_category ON projects(category);