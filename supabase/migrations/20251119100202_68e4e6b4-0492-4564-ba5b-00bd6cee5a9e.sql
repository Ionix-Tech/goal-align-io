-- Adicionar o novo status 'completed' ao enum project_status
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'completed';

-- Criar índice para melhorar performance de consultas por status
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);