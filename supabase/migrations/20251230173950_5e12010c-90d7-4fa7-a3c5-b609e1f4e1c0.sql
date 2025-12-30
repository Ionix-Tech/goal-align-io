-- Add new category values to enum
ALTER TYPE project_category ADD VALUE IF NOT EXISTS 'administrativo_financas';
ALTER TYPE project_category ADD VALUE IF NOT EXISTS 'operacoes';
ALTER TYPE project_category ADD VALUE IF NOT EXISTS 'centro_inteligencia';
ALTER TYPE project_category ADD VALUE IF NOT EXISTS 'business_design';