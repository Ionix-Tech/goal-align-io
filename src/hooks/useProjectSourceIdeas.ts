import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface LinkedIdea {
  id: string;
  idea_id: string;
  added_at: string;
  added_by: string;
  notes: string | null;
  idea: {
    id: string;
    name: string;
    description: string | null;
    created_at: string | null;
    created_by_profile: {
      full_name: string;
    } | null;
  };
  added_by_profile: {
    full_name: string;
  } | null;
}

// Fetch all ideas linked to a project
export function useProjectSourceIdeas(projectId: string | null) {
  return useQuery({
    queryKey: ['project-source-ideas', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_source_ideas')
        .select(`
          id,
          idea_id,
          added_at,
          added_by,
          notes,
          idea:projects!project_source_ideas_idea_id_fkey(
            id,
            name,
            description,
            created_at,
            created_by_profile:profiles!projects_created_by_fkey(full_name)
          ),
          added_by_profile:profiles!project_source_ideas_added_by_fkey(full_name)
        `)
        .eq('project_id', projectId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return (data || []) as LinkedIdea[];
    },
    enabled: !!projectId,
  });
}

// Fetch available ideas (not already linked to any project)
export function useAvailableIdeas(excludeProjectId?: string) {
  return useQuery({
    queryKey: ['available-ideas', excludeProjectId],
    queryFn: async () => {
      // First get all idea IDs that are already linked
      const { data: linkedIds, error: linkedError } = await supabase
        .from('project_source_ideas')
        .select('idea_id');

      if (linkedError) throw linkedError;

      const linkedIdeaIds = (linkedIds || []).map(l => l.idea_id);

      // Get all ideas that are not linked
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          created_at,
          created_by_profile:profiles!projects_created_by_fkey(full_name)
        `)
        .eq('initiative_type', 'idea')
        .order('created_at', { ascending: false });

      // Exclude already linked ideas
      if (linkedIdeaIds.length > 0) {
        query = query.not('id', 'in', `(${linkedIdeaIds.join(',')})`);
      }

      // Exclude the current project if it's an idea being converted
      if (excludeProjectId) {
        query = query.neq('id', excludeProjectId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });
}

// Link ideas to a project
export function useLinkIdeasToProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      ideaIds, 
      notes 
    }: { 
      projectId: string; 
      ideaIds: string[]; 
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const inserts = ideaIds.map(ideaId => ({
        project_id: projectId,
        idea_id: ideaId,
        added_by: user.id,
        notes: notes || null,
      }));

      const { data, error } = await supabase
        .from('project_source_ideas')
        .insert(inserts)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-source-ideas', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['available-ideas'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Ideias vinculadas com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error linking ideas:', error);
      toast.error('Erro ao vincular ideias', {
        description: error.message || 'Tente novamente.'
      });
    },
  });
}

// Unlink an idea from a project
export function useUnlinkIdeaFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, projectId }: { linkId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_source_ideas')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      return { linkId, projectId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-source-ideas', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['available-ideas'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Vínculo removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error unlinking idea:', error);
      toast.error('Erro ao remover vínculo', {
        description: error.message || 'Tente novamente.'
      });
    },
  });
}
