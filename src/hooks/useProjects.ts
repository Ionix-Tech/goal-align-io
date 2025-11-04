import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type StrategicPillar = Database['public']['Enums']['strategic_pillar'];

export type Project = Database['public']['Tables']['projects']['Row'] & {
  created_by_profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  assigned_to_profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  indicators: Array<{ id: string }>;
  milestones: Array<{ id: string; completed: boolean | null }>;
};

interface UseProjectsFilters {
  status?: ProjectStatus[];
  strategic_pillar?: StrategicPillar;
  assigned_to?: string;
  search?: string;
}

export function useProjects(filters?: UseProjectsFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          created_by_profile:profiles!projects_created_by_fkey(full_name, avatar_url),
          assigned_to_profile:profiles!projects_assigned_to_fkey(full_name, avatar_url),
          indicators:project_indicators(id),
          milestones:project_milestones(id, completed)
        `)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.strategic_pillar) {
        query = query.eq('strategic_pillar', filters.strategic_pillar as any);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by status
      const projectsByStatus = (data || []).reduce((acc, project) => {
        const status = project.status;
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(project as any);
        return acc;
      }, {
        idea: [],
        draft: [],
        review: [],
        approved: [],
        archived: []
      } as Record<ProjectStatus, any[]>);

      return {
        all: (data || []) as any[],
        byStatus: projectsByStatus
      };
    }
  });
}
