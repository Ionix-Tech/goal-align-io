export type InitiativeType = 'project' | 'action_plan' | 'idea';

export interface InitiativeLabels {
  singular: string;
  plural: string;
  article: string;
  approve: string;
  approveTitle: string;
  approveDescription: (name: string) => string;
  reject: string;
  rejectTitle: string;
  rejectDescription: string;
  archive: string;
  archiveTitle: string;
  archiveDescription: string;
  edit: string;
  review: string;
  details: string;
  create: string;
  submitted: string;
  approved: string;
  nameLabel: string;
  ideaTab: string;
  detailTab: string;
}

export const INITIATIVE_LABELS: Record<InitiativeType, InitiativeLabels> = {
  project: {
    singular: 'Projeto',
    plural: 'Projetos',
    article: 'o',
    approve: 'Aprovar Projeto',
    approveTitle: 'Aprovar Projeto?',
    approveDescription: (name: string) => `Você está prestes a aprovar "${name}". Esta ação irá notificar o criador e membros do projeto.`,
    reject: 'Solicitar Ajustes',
    rejectTitle: 'Solicitar Ajustes?',
    rejectDescription: 'O projeto será devolvido para "Detalhamento" e o criador será notificado sobre os ajustes necessários.',
    archive: 'Arquivar Projeto',
    archiveTitle: 'Arquivar Projeto?',
    archiveDescription: 'O projeto será movido para "Arquivados" e o criador será notificado. Esta ação indica que o projeto não será desenvolvido.',
    edit: 'Editar Projeto',
    review: 'Revisar Projeto',
    details: 'Detalhes do Projeto',
    create: 'Criar Projeto',
    submitted: 'Projeto enviado para aprovação',
    approved: 'Projeto aprovado',
    nameLabel: 'Nome do Projeto',
    ideaTab: '💡 Ideia Original',
    detailTab: '📝 Detalhamento',
  },
  action_plan: {
    singular: 'Plano de Ação',
    plural: 'Planos de Ação',
    article: 'o',
    approve: 'Aprovar Plano',
    approveTitle: 'Aprovar Plano de Ação?',
    approveDescription: (name: string) => `Você está prestes a aprovar o plano de ação "${name}". Esta ação irá notificar o criador e membros.`,
    reject: 'Solicitar Ajustes',
    rejectTitle: 'Solicitar Ajustes?',
    rejectDescription: 'O plano será devolvido para "Detalhamento" e o criador será notificado sobre os ajustes necessários.',
    archive: 'Arquivar Plano',
    archiveTitle: 'Arquivar Plano de Ação?',
    archiveDescription: 'O plano será movido para "Arquivados" e o criador será notificado. Esta ação indica que o plano não será executado.',
    edit: 'Editar Plano de Ação',
    review: 'Revisar Plano de Ação',
    details: 'Detalhes do Plano de Ação',
    create: 'Criar Plano de Ação',
    submitted: 'Plano enviado para aprovação',
    approved: 'Plano de ação aprovado',
    nameLabel: 'Nome do Plano',
    ideaTab: '💡 Ideia Original',
    detailTab: '📝 5W2H',
  },
  idea: {
    singular: 'Ideia',
    plural: 'Ideias',
    article: 'a',
    approve: 'Aprovar Ideia',
    approveTitle: 'Aprovar Ideia?',
    approveDescription: (name: string) => `Você está prestes a aprovar a ideia "${name}".`,
    reject: 'Solicitar Ajustes',
    rejectTitle: 'Solicitar Ajustes?',
    rejectDescription: 'A ideia será devolvida para ajustes.',
    archive: 'Arquivar Ideia',
    archiveTitle: 'Arquivar Ideia?',
    archiveDescription: 'A ideia será arquivada.',
    edit: 'Editar Ideia',
    review: 'Revisar Ideia',
    details: 'Detalhes da Ideia',
    create: 'Criar Ideia',
    submitted: 'Ideia enviada para análise',
    approved: 'Ideia aprovada',
    nameLabel: 'Nome da Ideia',
    ideaTab: '💡 Descrição',
    detailTab: '📝 Detalhes',
  },
};

export function getInitiativeLabels(type: InitiativeType | string | undefined): InitiativeLabels {
  if (type === 'action_plan') return INITIATIVE_LABELS.action_plan;
  if (type === 'idea') return INITIATIVE_LABELS.idea;
  return INITIATIVE_LABELS.project;
}

// Campos obrigatórios por tipo para validação
export const REQUIRED_FIELDS = {
  project: {
    forDraft: ['name', 'context'],
    forReview: ['name', 'context', 'strategic_pillar', 'objective', 'indicators', 'milestones'],
  },
  action_plan: {
    forDraft: ['name'],
    forReview: ['name', 'what', 'why', 'when_end'],
  },
  idea: {
    forDraft: ['name'],
    forReview: ['name', 'description'],
  },
};

export function getRequiredFields(type: InitiativeType | string | undefined) {
  if (type === 'action_plan') return REQUIRED_FIELDS.action_plan;
  if (type === 'idea') return REQUIRED_FIELDS.idea;
  return REQUIRED_FIELDS.project;
}
