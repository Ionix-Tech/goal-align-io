-- Script para popular projeto de teste completo com dados A3
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Criar projeto aprovado
INSERT INTO public.projects (
  name,
  status,
  strategic_pillar,
  context,
  objective,
  idea,
  requirements,
  created_by,
  assignee_id
)
SELECT
  'Redução de Retrabalho na Linha de Produção',
  'approved',
  'operational_efficiency',
  'A linha de produção da fábrica de Curitiba apresenta alta taxa de retrabalho devido a falhas no processo de montagem. Isso gera custos adicionais de R$ 80.000/mês e atrasos nas entregas. Análise inicial indica que 70% dos problemas são causados por erros de setup e falta de padronização.',
  'Reduzir a taxa de retrabalho de 15% para menos de 3% em 6 meses, eliminando os principais pontos de falha identificados através da metodologia A3. Espera-se uma economia de R$ 60.000/mês e aumento de 20% na produtividade.',
  'Implementar metodologia A3 para reduzir desperdícios e melhorar qualidade',
  'Requisitos do projeto:
- Implementar sistema poka-yoke em 5 estações críticas
- Treinar 100% dos operadores em trabalho padronizado
- Criar checklists de setup visual
- Implementar sistema de gestão visual no gemba
- Garantir sustentação através de auditorias semanais',
  id,
  id
FROM public.profiles
LIMIT 1
RETURNING id;

-- PASSO 2: Adicionar situações A3 (guardar o project_id do passo anterior)
WITH new_project AS (
  SELECT id FROM public.projects
  WHERE name = 'Redução de Retrabalho na Linha de Produção'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.project_situations (project_id, current_problem, target_goal, display_order, created_by)
SELECT
  np.id,
  'Alta taxa de retrabalho de 15% na linha de montagem, causando prejuízo de R$ 80.000/mês. Principais causas: erros de setup (45%), falta de padronização (30%), treinamento inadequado (25%).',
  'Reduzir taxa de retrabalho para menos de 3%, implementando poka-yokes, trabalho padronizado e treinamento completo da equipe. Meta: economia de R$ 60.000/mês.',
  0,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1
RETURNING id;

-- PASSO 3: Adicionar indicadores às situações
WITH new_situation AS (
  SELECT ps.id as situation_id
  FROM public.project_situations ps
  JOIN public.projects proj ON ps.project_id = proj.id
  WHERE proj.name = 'Redução de Retrabalho na Linha de Produção'
  ORDER BY ps.created_at DESC
  LIMIT 1
)
INSERT INTO public.situation_indicators (situation_id, name, current_value, target_value, unit, display_order)
SELECT
  situation_id,
  'Taxa de Retrabalho',
  15.0,
  3.0,
  '%',
  0
FROM new_situation
UNION ALL
SELECT
  situation_id,
  'Custo de Retrabalho',
  80000,
  20000,
  'R$/mês',
  1
FROM new_situation
UNION ALL
SELECT
  situation_id,
  'Tempo de Setup',
  45,
  15,
  'min',
  2
FROM new_situation;

-- PASSO 4: Adicionar milestones ao projeto
WITH new_project AS (
  SELECT id FROM public.projects
  WHERE name = 'Redução de Retrabalho na Linha de Produção'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.project_milestones (project_id, title, description, target_date, completed, display_order)
SELECT
  id,
  'Análise de Causa Raiz Completa',
  'Realizar análise 5 Porquês e diagrama de Ishikawa para identificar causas fundamentais do retrabalho',
  CURRENT_DATE + INTERVAL '30 days',
  true,
  0
FROM new_project
UNION ALL
SELECT
  id,
  'Implementação de Poka-Yokes',
  'Instalar dispositivos à prova de erros nas 5 estações críticas identificadas',
  CURRENT_DATE + INTERVAL '60 days',
  true,
  1
FROM new_project
UNION ALL
SELECT
  id,
  'Treinamento da Equipe',
  'Treinar 100% dos operadores em trabalho padronizado e uso dos poka-yokes',
  CURRENT_DATE + INTERVAL '90 days',
  false,
  2
FROM new_project
UNION ALL
SELECT
  id,
  'Sistema de Gestão Visual',
  'Implementar quadros de gestão visual e indicadores no gemba',
  CURRENT_DATE + INTERVAL '120 days',
  false,
  3
FROM new_project
UNION ALL
SELECT
  id,
  'Validação e Sustentação',
  'Validar resultados e estabelecer rotina de auditorias para garantir sustentação',
  CURRENT_DATE + INTERVAL '180 days',
  false,
  4
FROM new_project;

-- PASSO 5: Adicionar indicadores ao projeto
WITH new_project AS (
  SELECT id FROM public.projects
  WHERE name = 'Redução de Retrabalho na Linha de Produção'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.project_indicators (project_id, name, current_state, target_state, unit, display_order)
SELECT
  id,
  'Taxa de Retrabalho',
  '15%',
  '3%',
  '%',
  0
FROM new_project
UNION ALL
SELECT
  id,
  'OEE (Overall Equipment Effectiveness)',
  '65%',
  '85%',
  '%',
  1
FROM new_project
UNION ALL
SELECT
  id,
  'Custo de Qualidade',
  'R$ 80.000',
  'R$ 20.000',
  'R$/mês',
  2
FROM new_project
UNION ALL
SELECT
  id,
  'First Pass Yield',
  '85%',
  '97%',
  '%',
  3
FROM new_project;

-- PASSO 6: Adicionar tarefas ao projeto
WITH new_project AS (
  SELECT id FROM public.projects
  WHERE name = 'Redução de Retrabalho na Linha de Produção'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.project_tasks (project_id, title, description, status, priority, task_number, display_order, created_by)
SELECT
  np.id,
  'Realizar análise 5 Porquês',
  'Conduzir análise de causa raiz com time de produção para identificar causas fundamentais',
  'completed',
  'high',
  '1',
  0,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1
UNION ALL
SELECT
  np.id,
  'Mapear estações críticas',
  'Identificar as 5 estações com maior índice de retrabalho através de dados históricos',
  'completed',
  'high',
  '1.1',
  1,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1
UNION ALL
SELECT
  np.id,
  'Projetar dispositivos poka-yoke',
  'Desenvolver 5 dispositivos à prova de erros customizados para as estações críticas',
  'in_progress',
  'high',
  '2',
  2,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1
UNION ALL
SELECT
  np.id,
  'Fabricar e instalar poka-yokes',
  'Fabricar dispositivos e realizar instalação nas estações de produção',
  'pending',
  'medium',
  '2.1',
  3,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1
UNION ALL
SELECT
  np.id,
  'Desenvolver material de treinamento',
  'Criar apresentações, procedimentos operacionais e material visual para treinamento',
  'in_progress',
  'high',
  '3',
  4,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1
UNION ALL
SELECT
  np.id,
  'Executar treinamentos práticos',
  'Realizar sessões hands-on com todos os operadores em 4 turmas',
  'pending',
  'high',
  '3.1',
  5,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1
UNION ALL
SELECT
  np.id,
  'Implementar gestão visual',
  'Criar quadros Andon, gráficos de indicadores e checklists visuais no gemba',
  'pending',
  'medium',
  '4',
  6,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1
UNION ALL
SELECT
  np.id,
  'Estabelecer rotina de auditorias',
  'Criar checklist e escala de auditorias semanais para garantir sustentação',
  'pending',
  'medium',
  '5',
  7,
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1;

-- PASSO 7: Adicionar health status
WITH new_project AS (
  SELECT id FROM public.projects
  WHERE name = 'Redução de Retrabalho na Linha de Produção'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.project_health_status (project_id, status, notes, recorded_by)
SELECT
  np.id,
  'amber',
  'Projeto avançando conforme planejado. Poka-yokes instalados com sucesso. Atenção necessária para conclusão dos treinamentos no prazo.',
  p.id
FROM new_project np
CROSS JOIN public.profiles p
LIMIT 1;

-- PASSO 8: Adicionar atualizações de milestones
WITH completed_milestone AS (
  SELECT m.id as milestone_id, p.id as user_id
  FROM public.project_milestones m
  JOIN public.projects proj ON m.project_id = proj.id
  CROSS JOIN public.profiles p
  WHERE proj.name = 'Redução de Retrabalho na Linha de Produção'
  AND m.title = 'Análise de Causa Raiz Completa'
  ORDER BY m.created_at DESC
  LIMIT 1
)
INSERT INTO public.project_milestone_updates (milestone_id, progress_percentage, is_critical, notes, updated_by)
SELECT
  milestone_id,
  100,
  false,
  'Análise concluída com sucesso. Identificadas 3 causas principais: erro de setup (45%), falta de trabalho padronizado (30%), e treinamento inadequado (25%). Plano de ação definido.',
  user_id
FROM completed_milestone;

-- PASSO 9: Adicionar medições de indicadores
WITH indicator_data AS (
  SELECT i.id as indicator_id, p.id as user_id
  FROM public.project_indicators i
  JOIN public.projects proj ON i.project_id = proj.id
  CROSS JOIN public.profiles p
  WHERE proj.name = 'Redução de Retrabalho na Linha de Produção'
  AND i.name = 'Taxa de Retrabalho'
  ORDER BY i.created_at DESC
  LIMIT 1
)
INSERT INTO public.project_indicator_updates (indicator_id, measured_value, measurement_date, progress_percentage, notes, updated_by)
SELECT
  indicator_id,
  '12%',
  CURRENT_DATE - INTERVAL '30 days',
  25,
  'Primeira medição após implementação dos poka-yokes na estação 1 e 2',
  user_id
FROM indicator_data
UNION ALL
SELECT
  indicator_id,
  '9%',
  CURRENT_DATE - INTERVAL '15 days',
  50,
  'Redução consistente após instalação de mais 2 poka-yokes e início dos treinamentos',
  user_id
FROM indicator_data
UNION ALL
SELECT
  indicator_id,
  '7%',
  CURRENT_DATE - INTERVAL '7 days',
  67,
  'Progresso acelerado. Meta de 3% parece alcançável com conclusão dos treinamentos',
  user_id
FROM indicator_data;

-- PASSO 10: Adicionar weekly update
WITH new_project AS (
  SELECT id as project_id, created_by
  FROM public.projects
  WHERE name = 'Redução de Retrabalho na Linha de Produção'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.project_weekly_updates (
  project_id,
  week_start_date,
  week_end_date,
  health_status,
  progress_summary,
  challenges,
  key_initiatives,
  results_achieved,
  next_steps,
  created_by
)
SELECT
  project_id,
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE,
  'amber',
  'Semana produtiva com instalação de 4 dos 5 poka-yokes concluída. Taxa de retrabalho reduziu de 15% para 7% nas estações já implementadas. Treinamentos iniciados com primeira turma de 25 operadores.',
  'Atraso de 3 dias na entrega do último dispositivo poka-yoke devido a problema com fornecedor. Necessário acelerar cronograma de treinamentos para compensar.',
  'Instalação de poka-yokes nas estações 1, 2, 3 e 4; Início do programa de treinamento; Criação de procedimentos operacionais padrão visuais',
  'Redução de 53% na taxa de retrabalho nas estações implementadas (de 15% para 7%); 25 operadores treinados e certificados; Economia estimada de R$ 35.000 no mês',
  'Concluir instalação do 5º poka-yoke até sexta; Treinar 75 operadores restantes nas próximas 2 semanas; Iniciar implementação de gestão visual no gemba',
  created_by
FROM new_project;

SELECT 'Projeto de teste criado com sucesso!' as status;
