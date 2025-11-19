import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ApprovedProject {
  id: string;
  name: string;
  strategic_pillar: 'operational_efficiency' | 'sales_expansion' | 'new_business' | null;
  assigned_to: string | null;
  approved_at: string | null;
  updated_at: string | null;
  assigned_to_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  indicators_count: number;
  milestones_total: number;
  milestones_completed: number;
  current_health?: 'green' | 'yellow' | 'red' | null;
  last_update?: string | null;
}

export function useApprovedProjects(pillar?: string | null) {
  return useQuery({
    queryKey: ['approved-projects', pillar],
    queryFn: async () => {
      // Buscar projetos aprovados
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          strategic_pillar,
          assigned_to,
          approved_at,
          updated_at,
          assigned_to_profile:profiles!projects_assigned_to_fkey(full_name, avatar_url)
        `)
        .in('status', ['approved', 'completed'])
        .order('approved_at', { ascending: false });

      if (pillar) {
        query = query.eq('strategic_pillar', pillar as any);
      }

      const { data: projects, error: projectsError } = await query;

      if (projectsError) throw projectsError;
      if (!projects) return [];

      // Buscar dados adicionais em paralelo para cada projeto
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          const [
            { data: indicators },
            { data: milestones },
            { data: healthStatus },
            { data: lastUpdate }
          ] = await Promise.all([
            supabase
              .from('project_indicators')
              .select('id')
              .eq('project_id', project.id),
            supabase
              .from('project_milestones')
              .select('id, completed')
              .eq('project_id', project.id),
            supabase
              .from('project_health_status')
              .select('health_status, reported_at')
              .eq('project_id', project.id)
              .order('reported_at', { ascending: false })
              .limit(1)
              .single(),
            supabase
              .from('project_weekly_updates')
              .select('submitted_at')
              .eq('project_id', project.id)
              .order('submitted_at', { ascending: false })
              .limit(1)
              .single()
          ]);

          return {
            ...project,
            indicators_count: indicators?.length || 0,
            milestones_total: milestones?.length || 0,
            milestones_completed: milestones?.filter(m => m.completed).length || 0,
            current_health: healthStatus?.health_status || null,
            last_update: lastUpdate?.submitted_at || null
          } as ApprovedProject;
        })
      );

      return enrichedProjects;
    }
  });
}
