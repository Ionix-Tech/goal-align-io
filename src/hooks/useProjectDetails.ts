import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  initiative_type: 'idea' | 'project';
  context: string | null;
  objective: string | null;
  requirements: string | null;
  what: string | null;
  why: string | null;
  who: string | null;
  where_location: string | null;
  when_start: string | null;
  when_end: string | null;
  how: string | null;
  how_much: string | null;
  thesis_id: string | null;
  strategic_pillar: 'operational_efficiency' | 'sales_expansion' | 'new_business' | null;
  strategic_indicator: string | null;
  status: 'idea' | 'draft' | 'review' | 'approved' | 'archived';
  is_critical: boolean;
  created_at: string;
  created_by: string;
  assigned_to: string | null;
  submitted_for_review_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  thesis_kpi?: {
    id: string;
    name: string;
    current_value: number | null;
    target_value: number | null;
    unit: string | null;
    description: string | null;
  } | null;
  source_idea_id: string | null;
  current_situation_description: string | null;
  target_situation_description: string | null;
  source_idea?: {
    id: string;
    name: string;
  } | null;
  thesis?: {
    id: string;
    name: string;
    objective: string;
  } | null;
  linkedKPI?: {
    id: string;
    name: string;
    current_value: number | null;
    target_value: number;
    unit: string | null;
  } | null;
  indicators: Array<{
    id: string;
    name: string;
    current_state: string;
    target_state: string;
    unit: string | null;
    progress?: number;
    trend?: 'up' | 'down' | 'stable';
    lastUpdate?: string | null;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    target_date: string;
    completed: boolean;
    completed_at: string | null;
    progress: number;
    milestone_type?: 'decolagem' | 'voo' | 'escala' | null;
    taskStats?: {
      total: number;
      completed: number;
    };
  }>;
  members: Array<{
    id: string;
    user: {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
  }>;
  comments: Array<{
    id: string;
    comment: string;
    created_at: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
  }>;
  creator: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  assignee: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    assigned_to: string | null;
    assigned_to_name?: string;
    status: string;
    milestone_id: string | null;
  }>;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    category: string | null;
  }>;
}

export function useProjectDetails(projectId: string | null) {
  return useQuery({
    queryKey: ['project-details', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      console.log('[useProjectDetails] Fetching project:', projectId);

      // Buscar projeto base
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('[useProjectDetails] Error fetching project:', projectError);
        throw projectError;
      }

      // Buscar dados relacionados em paralelo
      const [
        { data: indicators },
        { data: milestones },
        { data: members },
        { data: comments },
        { data: creator },
        { data: assignee },
        { data: sourceIdea },
        { data: thesisData },
        { data: thesisKPIs },
        { data: tasks },
        { data: attachments }
      ] = await Promise.all([
        supabase.from('project_indicators').select('*').eq('project_id', projectId),
        supabase.from('project_milestones').select('*').eq('project_id', projectId),
        supabase
          .from('project_members')
          .select('id, user_id, profiles(id, full_name, email, avatar_url)')
          .eq('project_id', projectId),
        supabase
          .from('project_comments')
          .select('id, comment, created_at, user_id, profiles(id, full_name, avatar_url)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        projectData.created_by
          ? supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', projectData.created_by).single()
          : Promise.resolve({ data: null }),
        projectData.assigned_to
          ? supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', projectData.assigned_to).single()
          : Promise.resolve({ data: null }),
        projectData.source_idea_id
          ? supabase.from('projects').select('id, name').eq('id', projectData.source_idea_id).single()
          : Promise.resolve({ data: null }),
        projectData.thesis_id
          ? supabase.from('strategic_theses').select('id, name, objective').eq('id', projectData.thesis_id).single()
          : Promise.resolve({ data: null }),
        projectData.thesis_id
          ? supabase.from('thesis_kpis').select('id, name, current_value, target_value, unit, description').eq('thesis_id', projectData.thesis_id)
          : Promise.resolve({ data: null }),
        supabase
          .from('project_tasks')
          .select('id, title, description, due_date, assigned_to, status, milestone_id, profiles:assigned_to(full_name)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
        supabase
          .from('project_attachments')
          .select('id, file_name, file_path, file_type, category')
          .eq('project_id', projectId)
      ]);

      // CHG-15: thesis_kpi = first KPI from thesis
      const thesisKpi = thesisKPIs?.[0] || null;

      // Encontrar o KPI vinculado ao projeto pelo strategic_indicator
      let linkedKPI = null;
      if (projectData.strategic_indicator && thesisKPIs && thesisKPIs.length > 0) {
        const normalizeForComparison = (str: string) => {
          return str
            .toLowerCase()
            .replace(/[\t\r\n]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        };

        const normalizedIndicator = normalizeForComparison(projectData.strategic_indicator);

        linkedKPI = thesisKPIs.find((kpi: any) => {
          const normalizedKPIName = normalizeForComparison(kpi.name);
          return normalizedKPIName === normalizedIndicator ||
                 normalizedKPIName.includes(normalizedIndicator) ||
                 normalizedIndicator.includes(normalizedKPIName);
        }) || null;
      }

      // Buscar milestone updates apenas se houver milestones
      const { data: milestoneUpdates } = milestones?.length
        ? await supabase
            .from('project_milestone_updates')
            .select('milestone_id, progress_percentage, updated_at')
            .in('milestone_id', milestones.map((m: any) => m.id))
            .order('updated_at', { ascending: false })
        : { data: null };

      // Calcular o progresso mais recente de cada milestone
      const milestoneProgressMap = new Map<string, number>();
      milestoneUpdates?.forEach((update: any) => {
        if (!milestoneProgressMap.has(update.milestone_id)) {
          milestoneProgressMap.set(update.milestone_id, update.progress_percentage);
        }
      });

      // Buscar indicator updates apenas se houver indicators
      const { data: indicatorUpdates } = indicators?.length
        ? await supabase
            .from('project_indicator_updates')
            .select('indicator_id, progress_percentage, measured_value, measurement_date')
            .in('indicator_id', indicators.map((ind: any) => ind.id))
            .order('measurement_date', { ascending: false })
        : { data: null };

      // Calcular progresso, trend e última atualização de cada indicator
      const indicatorProgressMap = new Map<string, number>();
      const indicatorLastUpdateMap = new Map<string, string>();
      const indicatorTrendMap = new Map<string, 'up' | 'down' | 'stable'>();

      // Agrupar updates por indicator
      const indicatorUpdatesGrouped = new Map<string, any[]>();
      indicatorUpdates?.forEach((update: any) => {
        if (!indicatorUpdatesGrouped.has(update.indicator_id)) {
          indicatorUpdatesGrouped.set(update.indicator_id, []);
        }
        indicatorUpdatesGrouped.get(update.indicator_id)!.push(update);
      });

      // Processar cada indicator
      indicatorUpdatesGrouped.forEach((updates, indicatorId) => {
        if (updates.length > 0) {
          // Pegar o progresso mais recente
          indicatorProgressMap.set(indicatorId, updates[0].progress_percentage);
          indicatorLastUpdateMap.set(indicatorId, updates[0].measurement_date);

          // Calcular trend se houver pelo menos 2 medições
          if (updates.length >= 2) {
            const latest = updates[0].progress_percentage;
            const previous = updates[1].progress_percentage;
            const diff = latest - previous;

            if (diff > 5) {
              indicatorTrendMap.set(indicatorId, 'up');
            } else if (diff < -5) {
              indicatorTrendMap.set(indicatorId, 'down');
            } else {
              indicatorTrendMap.set(indicatorId, 'stable');
            }
          }
        }
      });

      // Normalize initiative_type (action_plan -> project)
      const normalizedType = projectData.initiative_type === 'action_plan' ? 'project' : projectData.initiative_type;

      // Calcular estatísticas de tarefas por milestone para progresso automático
      const taskStatsByMilestone = new Map<string, { total: number; completed: number }>();
      (tasks || []).forEach((task: any) => {
        if (task.milestone_id) {
          const current = taskStatsByMilestone.get(task.milestone_id) || { total: 0, completed: 0 };
          current.total++;
          if (task.status === 'completed') {
            current.completed++;
          }
          taskStatsByMilestone.set(task.milestone_id, current);
        }
      });

      // Montar o objeto final
      const data = {
        ...projectData,
        initiative_type: normalizedType,
        thesis_kpi: thesisKpi,
        source_idea: sourceIdea || null,
        thesis: thesisData || null,
        linkedKPI,
        indicators: (indicators || []).map((ind: any) => ({
          ...ind,
          progress: indicatorProgressMap.get(ind.id) || 0,
          trend: indicatorTrendMap.get(ind.id) || undefined,
          lastUpdate: indicatorLastUpdateMap.get(ind.id) || null
        })),
        milestones: (milestones || []).map((m: any) => {
          const taskStats = taskStatsByMilestone.get(m.id) || { total: 0, completed: 0 };
          // Progresso automático: % de tarefas concluídas (se tiver tarefas vinculadas)
          const autoProgress = taskStats.total > 0 
            ? Math.round((taskStats.completed / taskStats.total) * 100)
            : 0;
          return {
            ...m,
            progress: autoProgress,
            taskStats
          };
        }),
        members: (members || []).map((m: any) => ({
          id: m.id,
          user: m.profiles
        })),
        comments: (comments || []).map((c: any) => ({
          id: c.id,
          comment: c.comment,
          created_at: c.created_at,
          user: c.profiles
        })),
        creator,
        assignee,
        tasks: (tasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          due_date: t.due_date,
          assigned_to: t.assigned_to,
          assigned_to_name: t.profiles?.full_name || null,
          status: t.status,
          milestone_id: t.milestone_id
        })),
        attachments: attachments || []
      };

      console.log('[useProjectDetails] Project data:', data);
      return data as unknown as ProjectDetails;
    },
    enabled: !!projectId,
    retry: false
  });
}
