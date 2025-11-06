import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MilestoneUpdate {
  id: string;
  milestone_id: string;
  progress_percentage: number;
  is_critical: boolean;
  notes: string | null;
  updated_by: string;
  updated_at: string;
  updater: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useMilestoneUpdates(milestoneId: string | null) {
  return useQuery({
    queryKey: ['milestone-updates', milestoneId],
    queryFn: async () => {
      if (!milestoneId) return [];

      const { data, error } = await supabase
        .from('project_milestone_updates')
        .select(`
          *,
          updater:profiles!project_milestone_updates_updated_by_fkey(full_name, avatar_url)
        `)
        .eq('milestone_id', milestoneId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MilestoneUpdate[];
    },
    enabled: !!milestoneId
  });
}

export function useCreateMilestoneUpdate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      milestoneId,
      progressPercentage,
      isCritical,
      notes
    }: {
      milestoneId: string;
      progressPercentage: number;
      isCritical?: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_milestone_updates')
        .insert({
          milestone_id: milestoneId,
          progress_percentage: progressPercentage,
          is_critical: isCritical || false,
          notes: notes || null,
          updated_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Se progresso é 100%, marcar milestone como completo
      if (progressPercentage === 100) {
        await supabase
          .from('project_milestones')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', milestoneId);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milestone-updates', variables.milestoneId] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      queryClient.invalidateQueries({ queryKey: ['approved-projects'] });
      toast.success('Progresso do milestone atualizado');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar milestone: ' + error.message);
    }
  });
}
