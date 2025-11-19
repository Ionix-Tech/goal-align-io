import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskDateHistoryEntry {
  id: string;
  task_id: string;
  old_date: string | null;
  new_date: string | null;
  reason: string | null;
  changed_by: string;
  changed_at: string;
  changer: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useTaskDateHistory(taskId: string | null) {
  return useQuery({
    queryKey: ['task-date-history', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_date_history')
        .select(`
          *,
          changer:profiles!task_date_history_changed_by_fkey(full_name, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TaskDateHistoryEntry[];
    },
    enabled: !!taskId
  });
}
