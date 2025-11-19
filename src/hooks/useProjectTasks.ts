import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type TaskStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'blocked' 
  | 'review' 
  | 'paused' 
  | 'completed';

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  completed_at: string | null;
  due_date: string | null;
  created_at: string;
  milestone_id: string | null;
  indicator_id: string | null;
  assignee?: {
    full_name: string;
    avatar_url: string | null;
  };
  creator: {
    full_name: string;
    avatar_url: string | null;
  };
  milestone?: {
    id: string;
    title: string;
  } | null;
  indicator?: {
    id: string;
    name: string;
  } | null;
}

export function useProjectTasks(projectId: string | null) {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          *,
          assignee:profiles!project_tasks_assigned_to_fkey(full_name, avatar_url),
          creator:profiles!project_tasks_created_by_fkey(full_name, avatar_url),
          milestone:project_milestones(id, title),
          indicator:project_indicators(id, name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProjectTask[];
    },
    enabled: !!projectId
  });
}

export function useCreateTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      title,
      description,
      assignedTo,
      dueDate,
      milestoneId,
      indicatorId,
      priority
    }: {
      projectId: string;
      title: string;
      description?: string;
      assignedTo?: string;
      dueDate?: string;
      milestoneId?: string;
      indicatorId?: string;
      priority?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          project_id: projectId,
          title,
          description: description || null,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
          milestone_id: milestoneId || null,
          indicator_id: indicatorId || null,
          priority: priority || 'medium',
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', variables.projectId] });
      toast.success('Tarefa adicionada');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar tarefa: ' + error.message);
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      projectId,
      title,
      description,
      status,
      assignedTo,
      dueDate,
      milestoneId,
      indicatorId,
      priority,
      dateChangeReason
    }: {
      taskId: string;
      projectId: string;
      title?: string;
      description?: string;
      status?: TaskStatus;
      assignedTo?: string | null;
      dueDate?: string | null;
      milestoneId?: string | null;
      indicatorId?: string | null;
      priority?: string;
      dateChangeReason?: string;
    }) => {
      // First, get the current task to compare dates
      const { data: currentTask } = await supabase
        .from('project_tasks')
        .select('due_date')
        .eq('id', taskId)
        .single();
      
      const oldDueDate = currentTask?.due_date;
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) {
        updateData.status = status;
        // Auto-set completed_at when marking as completed
        if (status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        } else {
          updateData.completed_at = null;
        }
      }
      if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
      if (dueDate !== undefined) updateData.due_date = dueDate;
      if (milestoneId !== undefined) updateData.milestone_id = milestoneId;
      if (indicatorId !== undefined) updateData.indicator_id = indicatorId;
      if (priority !== undefined) updateData.priority = priority;

      const { data, error } = await supabase
        .from('project_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // If due_date changed, log it in task_date_history
      if (dueDate !== undefined && oldDueDate !== dueDate) {
        await supabase
          .from('task_date_history')
          .insert({
            task_id: taskId,
            old_date: oldDueDate,
            new_date: dueDate,
            reason: dateChangeReason || null,
            changed_by: user?.id
          });
      }

      return { data, projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', result.projectId] });
      toast.success('Tarefa atualizada');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      projectId
    }: {
      taskId: string;
      projectId: string;
    }) => {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast.success('Tarefa removida');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover tarefa: ' + error.message);
    }
  });
}
