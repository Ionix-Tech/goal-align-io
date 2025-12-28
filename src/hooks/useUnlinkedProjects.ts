import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnlinkedProject {
  id: string;
  name: string;
  description: string | null;
  initiative_type: 'idea' | 'project';
  status: string;
  created_at: string;
  assigned_to_profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export function useUnlinkedProjects() {
  return useQuery({
    queryKey: ["unlinked-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          initiative_type,
          status,
          created_at,
          assigned_to_profile:profiles!projects_assigned_to_fkey(
            full_name,
            avatar_url
          )
        `)
        .is("thesis_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Normalize action_plan to project
      const normalized = (data || []).map(p => ({
        ...p,
        initiative_type: p.initiative_type === 'action_plan' ? 'project' : p.initiative_type
      })) as UnlinkedProject[];

      return {
        all: normalized,
        ideas: normalized.filter(p => p.initiative_type === "idea"),
        projects: normalized.filter(p => p.initiative_type === "project"),
      };
    },
  });
}
