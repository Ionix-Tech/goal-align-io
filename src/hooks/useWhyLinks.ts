import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhyLink {
  id: string;
  project_id: string;
  url: string;
  label: string | null;
  created_at: string;
}

export const useWhyLinks = (projectId: string | null) => {
  return useQuery({
    queryKey: ['why-links', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_why_links')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as WhyLink[];
    },
    enabled: !!projectId
  });
};

export const useCreateWhyLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, url, label }: { projectId: string; url: string; label?: string }) => {
      const { data, error } = await supabase
        .from('project_why_links')
        .insert({
          project_id: projectId,
          url,
          label: label || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['why-links', variables.projectId] });
    }
  });
};

export const useDeleteWhyLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, projectId }: { linkId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_why_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['why-links', variables.projectId] });
    }
  });
};

export const useSaveWhyLinks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, links }: { projectId: string; links: Array<{ url: string; label?: string }> }) => {
      // Delete existing links
      await supabase
        .from('project_why_links')
        .delete()
        .eq('project_id', projectId);

      // Insert new links
      if (links.length > 0) {
        const { error } = await supabase
          .from('project_why_links')
          .insert(links.map(link => ({
            project_id: projectId,
            url: link.url,
            label: link.label || null
          })));

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['why-links', variables.projectId] });
    }
  });
};
