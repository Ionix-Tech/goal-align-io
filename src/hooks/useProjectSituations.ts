import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ProjectSituation {
  id: string;
  project_id: string;
  current_problem: string;
  target_goal: string;
  numeric_current: number | null;
  numeric_target: number | null;
  unit: string | null;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  linked_tasks?: string[];
}

export function useProjectSituations(projectId: string | null) {
  return useQuery({
    queryKey: ['project-situations', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_situations')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Fetch linked tasks for each situation
      const situationsWithTasks = await Promise.all(
        (data || []).map(async (situation) => {
          const { data: links } = await supabase
            .from('situation_tasks')
            .select('task_id')
            .eq('situation_id', situation.id);

          return {
            ...situation,
            linked_tasks: links?.map(l => l.task_id) || []
          };
        })
      );

      return situationsWithTasks as ProjectSituation[];
    },
    enabled: !!projectId
  });
}

export function useCreateSituation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      currentProblem,
      targetGoal,
      numericCurrent,
      numericTarget,
      unit,
      linkedTasks
    }: {
      projectId: string;
      currentProblem: string;
      targetGoal: string;
      numericCurrent?: number;
      numericTarget?: number;
      unit?: string;
      linkedTasks?: string[];
    }) => {
      // Create situation
      const { data: situation, error } = await supabase
        .from('project_situations')
        .insert({
          project_id: projectId,
          current_problem: currentProblem,
          target_goal: targetGoal,
          numeric_current: numericCurrent || null,
          numeric_target: numericTarget || null,
          unit: unit || null,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Link tasks if provided
      if (linkedTasks && linkedTasks.length > 0) {
        const links = linkedTasks.map(taskId => ({
          situation_id: situation.id,
          task_id: taskId
        }));

        const { error: linkError } = await supabase
          .from('situation_tasks')
          .insert(links);

        if (linkError) throw linkError;
      }

      return situation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-situations', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.projectId] });
      toast.success('Situação criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar situação: ' + error.message);
    }
  });
}

export function useUpdateSituation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      situationId,
      projectId,
      currentProblem,
      targetGoal,
      numericCurrent,
      numericTarget,
      unit,
      linkedTasks
    }: {
      situationId: string;
      projectId: string;
      currentProblem?: string;
      targetGoal?: string;
      numericCurrent?: number | null;
      numericTarget?: number | null;
      unit?: string | null;
      linkedTasks?: string[];
    }) => {
      // Update situation
      const updateData: any = { updated_at: new Date().toISOString() };
      if (currentProblem !== undefined) updateData.current_problem = currentProblem;
      if (targetGoal !== undefined) updateData.target_goal = targetGoal;
      if (numericCurrent !== undefined) updateData.numeric_current = numericCurrent;
      if (numericTarget !== undefined) updateData.numeric_target = numericTarget;
      if (unit !== undefined) updateData.unit = unit;

      const { error } = await supabase
        .from('project_situations')
        .update(updateData)
        .eq('id', situationId);

      if (error) throw error;

      // Update linked tasks if provided
      if (linkedTasks !== undefined) {
        // Delete existing links
        await supabase
          .from('situation_tasks')
          .delete()
          .eq('situation_id', situationId);

        // Create new links
        if (linkedTasks.length > 0) {
          const links = linkedTasks.map(taskId => ({
            situation_id: situationId,
            task_id: taskId
          }));

          const { error: linkError } = await supabase
            .from('situation_tasks')
            .insert(links);

          if (linkError) throw linkError;
        }
      }

      return situationId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-situations', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.projectId] });
      toast.success('Situação atualizada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar situação: ' + error.message);
    }
  });
}

export function useDeleteSituation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ situationId, projectId }: { situationId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_situations')
        .delete()
        .eq('id', situationId);

      if (error) throw error;
      return situationId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-situations', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.projectId] });
      toast.success('Situação removida com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover situação: ' + error.message);
    }
  });
}
