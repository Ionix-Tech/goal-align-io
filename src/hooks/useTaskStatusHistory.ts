import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TaskStatus } from './useProjectTasks';

export interface TaskStatusHistoryEntry {
  id: string;
  task_id: string;
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  notes: string | null;
  changed_by: string;
  changed_at: string;
  changer: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useTaskStatusHistory(taskId: string | null) {
  return useQuery({
    queryKey: ['task-status-history', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_status_history')
        .select(`
          *,
          changer:profiles!task_status_history_changed_by_fkey(full_name, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TaskStatusHistoryEntry[];
    },
    enabled: !!taskId
  });
}

export function useCreateStatusHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      oldStatus,
      newStatus,
      notes
    }: {
      taskId: string;
      oldStatus: TaskStatus | null;
      newStatus: TaskStatus;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_status_history')
        .insert({
          task_id: taskId,
          old_status: oldStatus,
          new_status: newStatus,
          notes: notes || null,
          changed_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-status-history', data.task_id] });
    },
    onError: (error: any) => {
      toast.error('Erro ao registrar histórico: ' + error.message);
    }
  });
}
