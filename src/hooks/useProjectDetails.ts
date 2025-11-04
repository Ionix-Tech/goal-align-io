import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  context: string | null;
  objective: string | null;
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
    current_state: string;
    target_state: string;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    target_date: string;
    completed: boolean;
    completed_at: string | null;
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

      // Montar o objeto final
      const data = {
        ...projectData,
        indicators: indicators || [],
        milestones: milestones || [],
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
