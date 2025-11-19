import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MilestoneDateHistoryEntry {
  id: string;
  milestone_id: string;
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

export function useMilestoneDateHistory(milestoneId: string | null) {
  return useQuery({
    queryKey: ['milestone-date-history', milestoneId],
    queryFn: async () => {
      if (!milestoneId) return [];

      const { data, error } = await supabase
        .from('milestone_date_history')
        .select(`
          *,
          changer:profiles!milestone_date_history_changed_by_fkey(full_name, avatar_url)
        `)
        .eq('milestone_id', milestoneId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MilestoneDateHistoryEntry[];
    },
    enabled: !!milestoneId
  });
}
