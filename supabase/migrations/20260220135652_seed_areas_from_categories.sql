-- Seed areas table with PROJECT_CATEGORIES data
-- These match the hardcoded categories used in the project creation wizard

INSERT INTO public.areas (name, code) VALUES
  ('Diretoria', 'diretoria'),
  ('Gestão de Pessoas', 'gestao_pessoas'),
  ('Administrativo/Finanças', 'administrativo_financas'),
  ('Operações', 'operacoes'),
  ('Logística', 'logistica'),
  ('Tecnologia da Informação', 'ti'),
  ('Comercial', 'comercial'),
  ('Centro de Inteligência Freitas', 'centro_inteligencia'),
  ('Business Design', 'business_design')
ON CONFLICT (code) DO NOTHING;
