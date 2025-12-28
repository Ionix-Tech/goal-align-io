import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectRequirement {
  id: string;
  project_id: string;
  code: string;
  description: string;
  indicator_name: string;
  unit: string | null;
  current_value: number | null;
  target_value: number | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useRequirements(projectId: string | null) {
  return useQuery({
    queryKey: ['project-requirements', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_requirements')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order');
      
      if (error) throw error;
      return data as ProjectRequirement[];
    },
    enabled: !!projectId
  });
}

export function useCreateRequirement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requirement: {
      project_id: string;
      code: string;
      description: string;
      indicator_name: string;
      unit?: string;
      display_order: number;
    }) => {
      const { data, error } = await supabase
        .from('project_requirements')
        .insert(requirement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-requirements', variables.project_id] });
    },
    onError: (error) => {
      toast.error("Erro ao criar requisito: " + error.message);
    }
  });
}

export function useUpdateRequirement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      projectId, 
      ...updates 
    }: Partial<ProjectRequirement> & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('project_requirements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-requirements', variables.projectId] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar requisito: " + error.message);
    }
  });
}

export function useDeleteRequirement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_requirements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-requirements', variables.projectId] });
      toast.success("Requisito removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover requisito: " + error.message);
    }
  });
}

export function useRequirementTaskLinks(projectId: string | null) {
  return useQuery({
    queryKey: ['requirement-task-links', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('requirement_task_links')
        .select(`
          *,
          requirement:project_requirements!inner(project_id)
        `)
        .eq('requirement.project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });
}

export function useLinkRequirementToTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requirementId, taskId }: { requirementId: string; taskId: string }) => {
      const { data, error } = await supabase
        .from('requirement_task_links')
        .insert({ requirement_id: requirementId, task_id: taskId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-task-links'] });
    }
  });
}

export function useUnlinkRequirementFromTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ requirementId, taskId }: { requirementId: string; taskId: string }) => {
      const { error } = await supabase
        .from('requirement_task_links')
        .delete()
        .eq('requirement_id', requirementId)
        .eq('task_id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-task-links'] });
    }
  });
}
