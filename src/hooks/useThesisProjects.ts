import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export interface ThesisProject extends Project {
  assigned_to_profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export interface ThesisProjectsGrouped {
  ideas: ThesisProject[];
  projects: ThesisProject[];
}

export function useThesisProjects(thesisId: string | undefined) {
  return useQuery({
    queryKey: ['thesis-projects', thesisId],
    queryFn: async (): Promise<ThesisProjectsGrouped> => {
      if (!thesisId) {
        return { ideas: [], projects: [] };
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          assigned_to_profile:profiles!projects_assigned_to_fkey(full_name, avatar_url)
        `)
        .eq('thesis_id', thesisId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const all = (data || []) as ThesisProject[];

      return {
        ideas: all.filter(p => p.initiative_type === 'idea'),
        // action_plan legados são agrupados junto com projetos
        projects: all.filter(p => p.initiative_type === 'project' || p.initiative_type === 'action_plan'),
      };
    },
    enabled: !!thesisId,
  });
}
