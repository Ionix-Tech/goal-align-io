import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      return data || [];
    }
  });
}

/**
 * Returns only team members assigned to a specific project.
 * Falls back to all profiles if projectId is not provided.
 */
export function useProjectTeamMembers(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ['project-team-members', projectId],
    queryFn: async () => {
      if (!projectId) {
        // Fallback: return all profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name');
        if (error) throw error;
        return data || [];
      }

      // Get project members and join with profiles
      const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId);

      if (membersError) throw membersError;

      const memberIds = (members || []).map(m => m.user_id);
      if (memberIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', memberIds)
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    enabled: projectId !== undefined
  });
}
