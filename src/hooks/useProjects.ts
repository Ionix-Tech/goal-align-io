import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type StrategicPillar = Database['public']['Enums']['strategic_pillar'];
type InitiativeType = Database['public']['Enums']['initiative_type'];
type ProjectCategory = Database['public']['Enums']['project_category'];

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
  category?: ProjectCategory;
}

export function useProjects(filters?: UseProjectsFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      // First, get all idea IDs that are linked to projects
      const { data: linkedIdeas } = await supabase
        .from('project_source_ideas')
        .select('idea_id');
      
      const linkedIdeaIds = (linkedIdeas || []).map(l => l.idea_id);

      let query = supabase
        .from('projects')
        .select(`
          *,
          created_by_profile:profiles!projects_created_by_fkey(full_name, avatar_url),
          assigned_to_profile:profiles!projects_assigned_to_fkey(full_name, avatar_url),
          thesis:strategic_theses(id, name, thesis_type),
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

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter out ideas that are already linked to projects (consumed ideas)
      // Also filter out action_plan (legacy data) - treat as project
      const filteredData = (data || []).filter(project => {
        // If it's an idea and it's linked to a project, exclude it from the list
        if (project.initiative_type === 'idea' && linkedIdeaIds.includes(project.id)) {
          return false;
        }
        return true;
      });

      // Group by status - but 'idea' column is based on initiative_type, not status
      const projectsByStatus = filteredData.reduce((acc, project) => {
        // Ideas go to 'idea' column based on initiative_type, regardless of status
        if (project.initiative_type === 'idea') {
          acc.idea.push(project as any);
        } else {
          // Projects use their actual status (action_plan treated as project)
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
        projects: filteredData.filter(p => p.initiative_type === 'project' || p.initiative_type === 'action_plan'),
        ideas: filteredData.filter(p => p.initiative_type === 'idea')
      };

      return {
        all: filteredData as any[],
        byStatus: projectsByStatus,
        byType: projectsByType
      };
    }
  });
}
