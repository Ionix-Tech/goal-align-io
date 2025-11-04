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

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          indicators:project_indicators(*),
          milestones:project_milestones(*),
          members:project_members(
            id,
            user:profiles(id, full_name, email, avatar_url)
          ),
          comments:project_comments(
            id,
            comment,
            created_at,
            user:profiles(id, full_name, avatar_url)
          ),
          creator:profiles!projects_created_by_fkey(id, full_name, email, avatar_url),
          assignee:profiles!projects_assigned_to_fkey(id, full_name, email, avatar_url)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as unknown as ProjectDetails;
    },
    enabled: !!projectId
  });
}
