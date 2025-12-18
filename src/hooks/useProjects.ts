import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type StrategicPillar = Database['public']['Enums']['strategic_pillar'];
type InitiativeType = Database['public']['Enums']['initiative_type'];

export type Project = Database['public']['Tables']['projects']['Row'] & {
  created_by_profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  assigned_to_profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  thesis?: {
    id: string;
    name: string;
    thesis_type: string;
  } | null;
  source_idea?: {
    id: string;
    name: string;
  } | null;
  indicators: Array<{ id: string }>;
  milestones: Array<{ id: string; completed: boolean | null }>;
};

interface UseProjectsFilters {
  status?: ProjectStatus[];
  strategic_pillar?: StrategicPillar;
  assigned_to?: string;
  search?: string;
  thesis_id?: string;
  initiative_type?: InitiativeType;
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
          thesis:strategic_theses(id, name, thesis_type),
          source_idea:projects!projects_source_idea_id_fkey(id, name),
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

      if (filters?.thesis_id) {
        query = query.eq('thesis_id', filters.thesis_id);
      }

      if (filters?.initiative_type) {
        query = query.eq('initiative_type', filters.initiative_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by status - but 'idea' column is based on initiative_type, not status
      const projectsByStatus = (data || []).reduce((acc, project) => {
        // Ideas go to 'idea' column based on initiative_type, regardless of status
        if (project.initiative_type === 'idea') {
          acc.idea.push(project as any);
        } else {
          // Projects and action_plans use their actual status
          const status = project.status;
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(project as any);
        }
        return acc;
      }, {
        idea: [],
        draft: [],
        review: [],
        approved: [],
        completed: [],
        archived: []
      } as Record<ProjectStatus, any[]>);

      // Group by type
      const projectsByType = {
        projects: (data || []).filter(p => p.initiative_type === 'project'),
        action_plans: (data || []).filter(p => p.initiative_type === 'action_plan'),
        ideas: (data || []).filter(p => p.initiative_type === 'idea')
      };

      return {
        all: (data || []) as any[],
        byStatus: projectsByStatus,
        byType: projectsByType
      };
    }
  });
}
