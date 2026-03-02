import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';
import { A3PresentationView } from '@/components/execution/A3PresentationView';
import type { ProjectDetails } from '@/hooks/useProjectDetails';
import type { ProjectSituation } from '@/hooks/useProjectSituations';

const mockProject: ProjectDetails = {
  id: 'mock-1',
  name: 'Projeto Alma Digital',
  description: 'Transformacao digital do setor operacional com foco em eficiencia',
  initiative_type: 'project',
  context: 'A empresa enfrenta desafios na gestao de processos manuais que impactam a produtividade em ate 30%.',
  objective: 'Reduzir em 40% o tempo de ciclo dos processos operacionais atraves da digitalizacao e automacao de fluxos criticos ate dezembro de 2026.',
  requirements: null,
  what: null,
  why: null,
  who: null,
  where_location: null,
  when_start: '2026-01-01',
  when_end: '2026-12-31',
  how: null,
  how_much: null,
  thesis_id: 'thesis-1',
  strategic_pillar: 'operational_efficiency',
  strategic_indicator: 'EBITDA',
  status: 'approved',
  is_critical: true,
  created_at: '2026-01-15T10:00:00Z',
  created_by: 'user-1',
  assigned_to: 'user-2',
  submitted_for_review_at: '2026-01-20T10:00:00Z',
  approved_at: '2026-01-25T10:00:00Z',
  approved_by: 'user-3',
  source_idea_id: null,
  current_situation_description: 'Processos manuais com alto indice de retrabalho',
  target_situation_description: 'Fluxos digitalizados com automacao de 80% das etapas',
  thesis: {
    id: 'thesis-1',
    name: 'Eficiencia Operacional 2026',
    objective: 'Otimizar processos internos para melhorar margens em 15%',
  },
  linkedKPI: {
    id: 'kpi-1',
    name: 'EBITDA',
    current_value: 2800000,
    target_value: 3500000,
    unit: 'R$',
  },
  indicators: [
    {
      id: 'ind-1',
      name: 'Tempo de Ciclo',
      current_state: '12',
      target_state: '7',
      unit: 'dias',
      progress: 58,
      trend: 'up' as const,
      lastUpdate: '2026-02-10',
    },
    {
      id: 'ind-2',
      name: 'Taxa de Retrabalho',
      current_state: '18',
      target_state: '5',
      unit: '%',
      progress: 42,
      trend: 'down' as const,
      lastUpdate: '2026-02-12',
    },
    {
      id: 'ind-3',
      name: 'NPS Interno',
      current_state: '62',
      target_state: '80',
      unit: '#',
      progress: 78,
      trend: 'up' as const,
      lastUpdate: '2026-02-14',
    },
    {
      id: 'ind-4',
      name: 'Custo por Transacao',
      current_state: '45',
      target_state: '25',
      unit: 'R$',
      progress: 35,
      trend: 'stable' as const,
      lastUpdate: '2026-02-08',
    },
  ],
  milestones: [
    {
      id: 'ms-1',
      title: 'Mapeamento de Processos AS-IS',
      description: 'Levantar todos os processos atuais',
      target_date: '2026-02-28',
      completed: true,
      completed_at: '2026-02-20T10:00:00Z',
      progress: 100,
      milestone_type: 'decolagem',
      taskStats: { total: 8, completed: 8 },
    },
    {
      id: 'ms-2',
      title: 'Prototipo do Sistema v1',
      description: 'Primeiro prototipo funcional',
      target_date: '2026-03-30',
      completed: false,
      completed_at: null,
      progress: 65,
      milestone_type: 'decolagem',
      taskStats: { total: 12, completed: 8 },
    },
    {
      id: 'ms-3',
      title: 'Piloto com Equipe Alpha',
      description: 'Teste com grupo piloto de 20 pessoas',
      target_date: '2026-05-15',
      completed: false,
      completed_at: null,
      progress: 20,
      milestone_type: 'voo',
      taskStats: { total: 6, completed: 1 },
    },
    {
      id: 'ms-4',
      title: 'Rollout Geral',
      description: 'Implantacao para toda a empresa',
      target_date: '2026-08-01',
      completed: false,
      completed_at: null,
      progress: 0,
      milestone_type: 'escala',
      taskStats: { total: 15, completed: 0 },
    },
    {
      id: 'ms-5',
      title: 'Estabilizacao e Otimizacao',
      description: 'Ajustes finos pos-implantacao',
      target_date: '2026-10-30',
      completed: false,
      completed_at: null,
      progress: 0,
      milestone_type: 'escala',
      taskStats: { total: 0, completed: 0 },
    },
  ],
  members: [
    { id: 'm1', user: { id: 'u1', full_name: 'Anderson Yenson', email: 'anderson@test.com', avatar_url: null } },
    { id: 'm2', user: { id: 'u2', full_name: 'Jhonathan Silva', email: 'jhon@test.com', avatar_url: null } },
    { id: 'm3', user: { id: 'u3', full_name: 'Maria Oliveira', email: 'maria@test.com', avatar_url: null } },
    { id: 'm4', user: { id: 'u4', full_name: 'Carlos Santos', email: 'carlos@test.com', avatar_url: null } },
  ],
  comments: [],
  creator: { id: 'user-1', full_name: 'Vinicius Costa', email: 'vinicius@test.com', avatar_url: null },
  assignee: { id: 'user-2', full_name: 'Jhonathan Silva', email: 'jhon@test.com', avatar_url: null },
  tasks: [
    { id: 't1', title: 'Entrevistar areas de negocio', description: null, due_date: '2026-02-15', assigned_to: 'u2', assigned_to_name: 'Jhonathan', status: 'completed', milestone_id: 'ms-1' },
    { id: 't2', title: 'Documentar fluxos no Miro', description: null, due_date: '2026-02-20', assigned_to: 'u3', assigned_to_name: 'Maria', status: 'completed', milestone_id: 'ms-1' },
    { id: 't3', title: 'Validar gaps com stakeholders', description: null, due_date: '2026-02-25', assigned_to: 'u1', assigned_to_name: 'Anderson', status: 'completed', milestone_id: 'ms-1' },
    { id: 't4', title: 'Definir arquitetura do sistema', description: null, due_date: '2026-03-05', assigned_to: 'u2', assigned_to_name: 'Jhonathan', status: 'completed', milestone_id: 'ms-2' },
    { id: 't5', title: 'Desenvolver modulo de cadastro', description: null, due_date: '2026-03-15', assigned_to: 'u4', assigned_to_name: 'Carlos', status: 'in_progress', milestone_id: 'ms-2' },
    { id: 't6', title: 'Integrar com ERP legado', description: null, due_date: '2026-03-25', assigned_to: 'u2', assigned_to_name: 'Jhonathan', status: 'pending', milestone_id: 'ms-2' },
    { id: 't7', title: 'Preparar ambiente de testes', description: null, due_date: '2026-04-10', assigned_to: 'u3', assigned_to_name: 'Maria', status: 'pending', milestone_id: 'ms-3' },
    { id: 't8', title: 'Treinar equipe piloto', description: null, due_date: '2026-05-01', assigned_to: 'u1', assigned_to_name: 'Anderson', status: 'pending', milestone_id: 'ms-3' },
  ],
  attachments: [],
};

const mockSituations: ProjectSituation[] = [
  {
    id: 'sit-1',
    project_id: 'mock-1',
    current_problem: 'Processos operacionais sao 100% manuais, gerando alto indice de erros (18% de retrabalho), tempo de ciclo elevado (12 dias por operacao) e dificuldade de rastreabilidade. A equipe gasta 60% do tempo em tarefas repetitivas que poderiam ser automatizadas.',
    target_goal: 'Digitalizar 80% dos fluxos operacionais criticos, reduzindo o tempo de ciclo para 7 dias, a taxa de retrabalho para 5% e liberando a equipe para atividades de maior valor agregado. Sistema integrado com dashboards de acompanhamento em tempo real.',
    display_order: 1,
    created_by: 'user-1',
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z',
    linked_tasks: [],
    indicators: [
      { id: 'si-1', name: 'Tempo de Ciclo', current_value: 12, target_value: 7, unit: 'dias' },
      { id: 'si-2', name: 'Taxa de Retrabalho', current_value: 18, target_value: 5, unit: '%' },
    ],
    current_image_path: null,
    target_image_path: null,
    attachments: [],
  },
  {
    id: 'sit-2',
    project_id: 'mock-1',
    current_problem: 'Comunicacao entre areas e fragmentada. Informacoes criticas se perdem em e-mails e planilhas descentralizadas, causando atrasos de ate 3 dias em tomadas de decisao.',
    target_goal: 'Plataforma centralizada de comunicacao e gestao de workflows, com notificacoes automaticas, escalation rules e historico completo de decisoes. Reducao do tempo de decisao para menos de 4 horas.',
    display_order: 2,
    created_by: 'user-1',
    created_at: '2026-01-22T10:00:00Z',
    updated_at: '2026-01-22T10:00:00Z',
    current_image_path: null,
    target_image_path: null,
    linked_tasks: [],
    indicators: [
      { id: 'si-3', name: 'Tempo de Decisao', current_value: 72, target_value: 4, unit: 'horas' },
    ],
    attachments: [],
  },
];

export default function A3PreviewMock() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex items-center justify-center h-screen bg-muted/30">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Preview A3 Presentation</h1>
        <p className="text-muted-foreground">Dados mock para testar a visualizacao</p>
        <Button size="lg" onClick={() => setOpen(true)}>
          <Monitor className="mr-2 h-5 w-5" />
          Abrir Apresentacao
        </Button>
      </div>

      <A3PresentationView
        open={open}
        onOpenChange={setOpen}
        project={mockProject}
        situations={mockSituations}
      />
    </div>
  );
}
