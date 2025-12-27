// Tipos de iniciativa suportados
// Nota: 'action_plan' é mantido para compatibilidade com dados legados, mas tratado como 'project'
export type InitiativeType = 'project' | 'idea';

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

/**
 * Retorna os labels para um tipo de iniciativa.
 * action_plan é tratado como project para compatibilidade com dados legados.
 */
export function getInitiativeLabels(type: InitiativeType | string | undefined): InitiativeLabels {
  if (type === 'idea') return INITIATIVE_LABELS.idea;
  // action_plan e project são tratados da mesma forma
  return INITIATIVE_LABELS.project;
}

// Campos obrigatórios por tipo para validação
export const REQUIRED_FIELDS = {
  project: {
    forDraft: ['name', 'context'],
    forReview: ['name', 'context', 'strategic_pillar', 'objective', 'indicators', 'milestones'],
  },
  idea: {
    forDraft: ['name'],
    forReview: ['name', 'description'],
  },
};

/**
 * Retorna os campos obrigatórios para um tipo de iniciativa.
 * action_plan é tratado como project para compatibilidade com dados legados.
 */
export function getRequiredFields(type: InitiativeType | string | undefined) {
  if (type === 'idea') return REQUIRED_FIELDS.idea;
  // action_plan e project são tratados da mesma forma
  return REQUIRED_FIELDS.project;
}
