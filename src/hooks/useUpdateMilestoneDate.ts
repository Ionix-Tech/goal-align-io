import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useUpdateMilestoneDate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      milestoneId,
      oldDate,
      newDate,
      reason
    }: {
      milestoneId: string;
      oldDate: string | null;
      newDate: string;
      reason?: string;
    }) => {
      // Update milestone target_date
      const { error: updateError } = await supabase
        .from('project_milestones')
        .update({ target_date: newDate })
        .eq('id', milestoneId);

      if (updateError) throw updateError;

      // Log the date change
      const { error: historyError } = await supabase
        .from('milestone_date_history')
        .insert({
          milestone_id: milestoneId,
          old_date: oldDate,
          new_date: newDate,
          reason: reason || null,
          changed_by: user?.id
        });

      if (historyError) throw historyError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      queryClient.invalidateQueries({ queryKey: ['milestone-date-history', variables.milestoneId] });
      toast.success('Data do milestone atualizada');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar data: ' + error.message);
    }
  });
}
