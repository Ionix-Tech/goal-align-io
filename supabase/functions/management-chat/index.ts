import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  health: string | null;
  progress: number;
  nextMilestone?: string;
  pendingTasks?: number;
  assignee?: string | null;
}

interface ManagementContext {
  type: 'management';
  summary?: {
    total: number;
    healthy: number;
    attention: number;
    critical: number;
    noStatus: number;
  };
  projects: ProjectSummary[];
  projectsSummary?: ProjectSummary[];
  workloadAnalysis?: {
    workload?: {
      totalTasks: number;
      unassignedTasks: number;
      overdueTasks: number;
      overloadedMembers: Array<{ name: string; activeTasks: number; overdue: number }>;
      highWorkloadMembers: Array<{ name: string; activeTasks: number }>;
    } | null;
    leadership?: {
      totalProjects: number;
      criticalProjects: number;
      unassignedProjects: number;
      overloadedLeaders: Array<{ name: string; totalProjects: number; critical: number }>;
    } | null;
  };
}

interface ExecutionContext {
  type: 'execution';
  project: {
    name: string;
    objective?: string;
    health?: string;
    milestones: Array<{
      title: string;
      targetDate: string;
      completed: boolean;
      type?: string;
    }>;
    indicators: Array<{
      name: string;
      current: string;
      target: string;
      unit?: string;
    }>;
    tasks: Array<{
      title: string;
      status: string;
      priority: string;
      dueDate?: string;
      assigneeName?: string;
    }>;
    pendingActions: number;
    completedActions: number;
    assignee?: string;
    members?: Array<{
      id: string;
      name: string;
    }>;
  };
}

type ChatContext = ManagementContext | ExecutionContext;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json() as { 
      messages: ChatMessage[]; 
      context: ChatContext;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt based on context
    let systemPrompt = `Você é um assistente de gestão de projetos especializado. Responda de forma concisa e acionável em português brasileiro.

REGRAS IMPORTANTES:
- Máximo 5 linhas por resposta, seja direto
- Foque em dados concretos disponíveis no contexto
- Sugira ações específicas quando apropriado
- Se não tiver informação suficiente, diga claramente
- Use emojis moderadamente para facilitar a leitura
- Formate listas com marcadores quando apropriado

`;

    if (context.type === 'management') {
      // Check if this is a workload analysis request
      if (context.workloadAnalysis) {
        const wa = context.workloadAnalysis;
        systemPrompt += `
CONTEXTO ATUAL: Análise de Carga de Trabalho

`;
        if (wa.workload) {
          systemPrompt += `CARGA DE TAREFAS:
- Total de tarefas: ${wa.workload.totalTasks}
- Tarefas sem responsável: ${wa.workload.unassignedTasks}
- Tarefas atrasadas: ${wa.workload.overdueTasks}

MEMBROS SOBRECARREGADOS (${wa.workload.overloadedMembers.length}):
${wa.workload.overloadedMembers.map(m => 
  `• ${m.name}: ${m.activeTasks} tarefas ativas, ${m.overdue} atrasadas`
).join('\n') || 'Nenhum membro sobrecarregado'}

MEMBROS COM ALTA CARGA (${wa.workload.highWorkloadMembers.length}):
${wa.workload.highWorkloadMembers.map(m => 
  `• ${m.name}: ${m.activeTasks} tarefas ativas`
).join('\n') || 'Nenhum membro com alta carga'}

`;
        }
        if (wa.leadership) {
          systemPrompt += `LIDERANÇA DE PROJETOS:
- Total de projetos ativos: ${wa.leadership.totalProjects}
- Projetos críticos: ${wa.leadership.criticalProjects}
- Projetos sem líder: ${wa.leadership.unassignedProjects}

LÍDERES SOBRECARREGADOS (${wa.leadership.overloadedLeaders.length}):
${wa.leadership.overloadedLeaders.map(l => 
  `• ${l.name}: ${l.totalProjects} projetos, ${l.critical} críticos`
).join('\n') || 'Nenhum líder sobrecarregado'}

`;
        }
        systemPrompt += `Sugira ações concretas para:
- Redistribuir tarefas de membros sobrecarregados
- Resolver projetos críticos
- Equilibrar carga de trabalho
- Atribuir responsáveis a itens sem dono`;
      } else {
        // Original management context with summary
        const summary = context.summary || { total: 0, healthy: 0, attention: 0, critical: 0, noStatus: 0 };
        const projects = context.projects || context.projectsSummary || [];
        
        systemPrompt += `
CONTEXTO ATUAL: Tela de Gestão de Projetos

RESUMO DO PORTFÓLIO:
- Total de projetos: ${summary.total}
- Saudáveis (verde): ${summary.healthy}
- Atenção (amarelo): ${summary.attention}
- Críticos (vermelho): ${summary.critical}
- Sem status: ${summary.noStatus}

LISTA DE PROJETOS:
${projects.map(p => 
  `• ${p.name} - Responsável: ${p.assignee || 'Não atribuído'} - Saúde: ${p.health || 'Não definida'} - Progresso: ${p.progress}%${p.pendingTasks ? ` - ${p.pendingTasks} tarefas pendentes` : ''}`
).join('\n')}

PROJETOS POR RESPONSÁVEL:
${Object.entries(
  projects.reduce((acc, p) => {
    const assignee = p.assignee || 'Não atribuído';
    if (!acc[assignee]) acc[assignee] = [];
    acc[assignee].push(p);
    return acc;
  }, {} as Record<string, typeof projects>)
).map(([assignee, projs]) => 
  `• ${assignee}: ${projs.length} projeto(s) - ${projs.filter(p => p.health === 'red').length} crítico(s)`
).join('\n')}

Você pode responder perguntas sobre:
- Quais projetos precisam de atenção
- Status geral do portfólio
- Comparativos entre projetos
- Sugestões de priorização
- Carga de trabalho por responsável
- Projetos de um responsável específico`;
      }
    } else {
      // Group tasks by status
      const tasksByStatus: Record<string, number> = {};
      const tasksByAssignee: Record<string, { pending: number; completed: number; overdue: number }> = {};
      const today = new Date().toISOString().split('T')[0];
      
      context.project.tasks.forEach(task => {
        // Count by status
        tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
        
        // Count by assignee
        const assignee = task.assigneeName || 'Não atribuído';
        if (!tasksByAssignee[assignee]) {
          tasksByAssignee[assignee] = { pending: 0, completed: 0, overdue: 0 };
        }
        
        if (task.status === 'done') {
          tasksByAssignee[assignee].completed++;
        } else {
          tasksByAssignee[assignee].pending++;
          if (task.dueDate && task.dueDate < today) {
            tasksByAssignee[assignee].overdue++;
          }
        }
      });
      
      // Calculate milestone progress
      const milestoneDetails = context.project.milestones.map(m => {
        const milestoneTasks = context.project.tasks.filter(t => 
          t.title.toLowerCase().includes(m.title.toLowerCase().split(' ')[0])
        );
        const completedMilestoneTasks = milestoneTasks.filter(t => t.status === 'done').length;
        const isOverdue = !m.completed && new Date(m.targetDate) < new Date();
        
        return {
          title: m.title,
          targetDate: m.targetDate,
          completed: m.completed,
          type: m.type,
          progress: milestoneTasks.length > 0 ? Math.round((completedMilestoneTasks / milestoneTasks.length) * 100) : null,
          isOverdue
        };
      });

      systemPrompt += `
CONTEXTO ATUAL: Tela de Execução de Projeto

PROJETO: ${context.project.name}
${context.project.objective ? `OBJETIVO: ${context.project.objective}` : ''}
SAÚDE: ${context.project.health || 'Não definida'}
${context.project.assignee ? `RESPONSÁVEL PRINCIPAL: ${context.project.assignee}` : ''}

TAREFAS POR STATUS:
${Object.entries(tasksByStatus).map(([status, count]) => `• ${status}: ${count}`).join('\n') || '• Nenhuma tarefa'}

TAREFAS POR RESPONSÁVEL:
${Object.entries(tasksByAssignee).map(([name, counts]) => 
  `• ${name}: ${counts.pending} pendentes${counts.overdue > 0 ? ` (${counts.overdue} atrasadas)` : ''}, ${counts.completed} concluídas`
).join('\n') || '• Nenhuma tarefa atribuída'}

MILESTONES (${context.project.milestones.length} total):
${milestoneDetails.map(m => 
  `• ${m.title} - ${m.completed ? '✅ Concluído' : `📅 ${m.targetDate}${m.isOverdue ? ' ⚠️ ATRASADO' : ''}`}${m.type ? ` (${m.type})` : ''}${m.progress !== null ? ` - ${m.progress}% progresso` : ''}`
).join('\n') || 'Nenhum milestone cadastrado'}

INDICADORES (${context.project.indicators.length} total):
${context.project.indicators.map(i => 
  `• ${i.name}: ${i.current}/${i.target}${i.unit ? ` ${i.unit}` : ''}`
).join('\n') || 'Nenhum indicador cadastrado'}

TAREFAS DETALHADAS (${context.project.tasks.length} total):
${context.project.tasks.slice(0, 15).map(t => 
  `• ${t.title} - ${t.status} - ${t.assigneeName || 'Sem responsável'}${t.dueDate ? ` - Prazo: ${t.dueDate}${t.dueDate < today && t.status !== 'done' ? ' ⚠️' : ''}` : ''}`
).join('\n') || 'Nenhuma tarefa cadastrada'}
${context.project.tasks.length > 15 ? `... e mais ${context.project.tasks.length - 15} tarefas` : ''}

${context.project.members?.length ? `MEMBROS DA EQUIPE: ${context.project.members.map(m => m.name).join(', ')}` : ''}

RESUMO DE AÇÕES:
- Ações pendentes: ${context.project.pendingActions}
- Ações concluídas: ${context.project.completedActions}

Você pode responder perguntas sobre:
- Status de tarefas de pessoas específicas (ex: "Tarefas do João")
- Tarefas atrasadas ou bloqueadas
- Status detalhado de milestones específicos
- Carga de trabalho por responsável
- Comparação entre membros da equipe`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos à sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar sua pergunta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Management chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
