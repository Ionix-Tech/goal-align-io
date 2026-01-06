/**
 * Configuração centralizada das regras de sobrecarga
 * 
 * Ajuste os valores de threshold para modificar quando cada nível é ativado.
 * Os labels definem como cada nível é exibido na interface.
 */

export const WORKLOAD_RULES = {
  // Regras para carga de tarefas (por membro da equipe)
  tasks: {
    thresholds: {
      low: 5,      // até 5 tarefas ativas = carga baixa
      medium: 10,  // até 10 tarefas ativas = carga média
      high: 15,    // até 15 tarefas ativas = carga alta
      // acima de 15 = sobrecarregado
    },
    labels: {
      low: "Baixa",
      medium: "Moderada",
      high: "Alta",
      overloaded: "Sobrecarregado",
    },
    colors: {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      overloaded: "bg-red-500",
    },
    badges: {
      low: "default" as const,
      medium: "secondary" as const,
      high: "outline" as const,
      overloaded: "destructive" as const,
    },
  },

  // Regras para liderança de projetos
  leadership: {
    thresholds: {
      overloadedCritical: 3,  // 3+ projetos críticos = sobrecarregado
      highCritical: 2,        // 2+ projetos críticos = alta carga
      highProjects: 5,        // mais de 5 projetos = alta carga
      mediumCritical: 1,      // 1 projeto crítico = carga média
      mediumProjects: 3,      // mais de 3 projetos = carga média
    },
    labels: {
      low: "Controlada",
      medium: "Moderada",
      high: "Alta",
      overloaded: "Sobrecarregado",
    },
    colors: {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      overloaded: "bg-red-500",
    },
    badges: {
      low: "default" as const,
      medium: "secondary" as const,
      high: "outline" as const,
      overloaded: "destructive" as const,
    },
  },
};

export type WorkloadLevel = "low" | "medium" | "high" | "overloaded";

/**
 * Calcula o nível de carga de trabalho baseado no número de tarefas ativas
 */
export function calculateTaskWorkloadLevel(activeTasks: number): WorkloadLevel {
  const { thresholds } = WORKLOAD_RULES.tasks;
  if (activeTasks <= thresholds.low) return "low";
  if (activeTasks <= thresholds.medium) return "medium";
  if (activeTasks <= thresholds.high) return "high";
  return "overloaded";
}

/**
 * Calcula o nível de liderança baseado no total de projetos e projetos críticos
 */
export function calculateLeadershipLevel(
  totalProjects: number,
  criticalProjects: number
): WorkloadLevel {
  const { thresholds } = WORKLOAD_RULES.leadership;
  if (criticalProjects >= thresholds.overloadedCritical) return "overloaded";
  if (criticalProjects >= thresholds.highCritical || totalProjects > thresholds.highProjects) return "high";
  if (criticalProjects >= thresholds.mediumCritical || totalProjects > thresholds.mediumProjects) return "medium";
  return "low";
}

/**
 * Retorna a configuração de exibição para carga de tarefas
 */
export function getTaskWorkloadConfig(level: WorkloadLevel) {
  return {
    label: WORKLOAD_RULES.tasks.labels[level],
    color: WORKLOAD_RULES.tasks.colors[level],
    badge: WORKLOAD_RULES.tasks.badges[level],
  };
}

/**
 * Retorna a configuração de exibição para liderança de projetos
 */
export function getLeadershipConfig(level: WorkloadLevel) {
  return {
    label: WORKLOAD_RULES.leadership.labels[level],
    color: WORKLOAD_RULES.leadership.colors[level],
    badge: WORKLOAD_RULES.leadership.badges[level],
  };
}
