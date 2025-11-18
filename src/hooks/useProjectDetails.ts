import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  context: string | null;
  objective: string | null;
  requirements: string | null;
  strategic_pillar: 'operational_efficiency' | 'sales_expansion' | 'new_business' | null;
  status: 'idea' | 'draft' | 'review' | 'approved' | 'archived';
  created_at: string;
  created_by: string;
  assigned_to: string | null;
  submitted_for_review_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
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
        { data: assignee }
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
          : Promise.resolve({ data: null })
      ]);

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
            .select('indicator_id, progress_percentage, measured_value, measurement_date, updated_at')
            .in('indicator_id', indicators.map((ind: any) => ind.id))
            .order('updated_at', { ascending: false })
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

      // Montar o objeto final
      const data = {
        ...projectData,
        indicators: (indicators || []).map((ind: any) => ({
          ...ind,
          progress: indicatorProgressMap.get(ind.id) || 0,
          trend: indicatorTrendMap.get(ind.id) || undefined,
          lastUpdate: indicatorLastUpdateMap.get(ind.id) || null
        })),
        milestones: (milestones || []).map((m: any) => ({
          ...m,
          progress: milestoneProgressMap.get(m.id) || 0
        })),
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
        assignee
      };

      console.log('[useProjectDetails] Project data:', data);
      return data as unknown as ProjectDetails;
    },
    enabled: !!projectId,
    retry: false
  });
}
