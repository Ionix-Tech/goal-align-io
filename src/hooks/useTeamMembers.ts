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

      // Also include the project leader (assigned_to) if not already in the list
      const { data: project } = await supabase
        .from('projects')
        .select('assigned_to')
        .eq('id', projectId)
        .single();

      if (project?.assigned_to && !memberIds.includes(project.assigned_to)) {
        memberIds.push(project.assigned_to);
      }

      if (memberIds.length === 0) {
        // Fallback: if project has no members yet, return all profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name');
        if (error) throw error;
        return data || [];
      }

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
