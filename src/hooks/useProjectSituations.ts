import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ProjectSituation {
  id: string;
  project_id: string;
  current_problem: string;
  target_goal: string;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  current_image_path?: string | null;
  target_image_path?: string | null;
  linked_tasks?: any[];
  indicators?: any[];
  attachments?: any[];
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

      // Fetch linked tasks, indicators, and attachments for each situation
      const situationsWithDetails = await Promise.all(
        (data || []).map(async (situation) => {
          // Fetch linked tasks
          const { data: taskLinks } = await supabase
            .from('situation_tasks')
            .select('task_id')
            .eq('situation_id', situation.id);

          const taskIds = taskLinks?.map(link => link.task_id) || [];
          let tasksData = [];
          if (taskIds.length > 0) {
            const { data: tasks } = await supabase
              .from('project_tasks')
              .select('*')
              .in('id', taskIds);
            tasksData = tasks || [];
          }

          // Fetch indicators
          const { data: indicators } = await supabase
            .from('situation_indicators')
            .select('*')
            .eq('situation_id', situation.id)
            .order('display_order');

          // Fetch attachments
          const { data: attachments } = await supabase
            .from('situation_attachments')
            .select('*')
            .eq('situation_id', situation.id)
            .order('uploaded_at', { ascending: false });

          return {
            ...situation,
            linked_tasks: tasksData || [],
            indicators: indicators || [],
            attachments: attachments || []
          };
        })
      );

      return situationsWithDetails as ProjectSituation[];
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
      linkedTasks,
      indicators
    }: {
      projectId: string;
      currentProblem: string;
      targetGoal: string;
      linkedTasks?: string[];
      indicators?: Array<{
        name: string;
        currentValue: number;
        targetValue: number;
        unit?: string;
        displayOrder: number;
      }>;
    }) => {
      // Create situation
      const { data: situation, error } = await supabase
        .from('project_situations')
        .insert({
          project_id: projectId,
          current_problem: currentProblem,
          target_goal: targetGoal,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create indicators if provided
      if (indicators && indicators.length > 0) {
        const indicatorRecords = indicators.map(ind => ({
          situation_id: situation.id,
          name: ind.name,
          current_value: ind.currentValue,
          target_value: ind.targetValue,
          unit: ind.unit || null,
          display_order: ind.displayOrder
        }));

        const { error: indicatorError } = await supabase
          .from('situation_indicators')
          .insert(indicatorRecords);

        if (indicatorError) throw indicatorError;
      }

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
      linkedTasks,
      currentImagePath,
      targetImagePath,
    }: {
      situationId: string;
      projectId: string;
      currentProblem?: string;
      targetGoal?: string;
      linkedTasks?: string[];
      currentImagePath?: string | null;
      targetImagePath?: string | null;
    }) => {
      // Update situation
      const updateData: any = { updated_at: new Date().toISOString() };
      if (currentProblem !== undefined) updateData.current_problem = currentProblem;
      if (targetGoal !== undefined) updateData.target_goal = targetGoal;
      if (currentImagePath !== undefined) updateData.current_image_path = currentImagePath;
      if (targetImagePath !== undefined) updateData.target_image_path = targetImagePath;

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
