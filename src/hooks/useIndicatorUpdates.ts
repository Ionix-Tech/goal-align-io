import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface IndicatorUpdate {
  id: string;
  indicator_id: string;
  measured_value: string;
  measurement_date: string;
  progress_percentage: number;
  notes: string | null;
  updated_by: string;
  created_at: string;
  updater: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useIndicatorUpdates(indicatorId: string | null) {
  return useQuery({
    queryKey: ['indicator-updates', indicatorId],
    queryFn: async () => {
      if (!indicatorId) return [];

      const { data, error } = await supabase
        .from('project_indicator_updates')
        .select(`
          *,
          updater:profiles!project_indicator_updates_updated_by_fkey(full_name, avatar_url)
        `)
        .eq('indicator_id', indicatorId)
        .order('measurement_date', { ascending: false });

      if (error) throw error;
      return (data || []) as IndicatorUpdate[];
    },
    enabled: !!indicatorId
  });
}

export function useCreateIndicatorUpdate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      indicatorId,
      measuredValue,
      measurementDate,
      progressPercentage,
      notes
    }: {
      indicatorId: string;
      measuredValue: string;
      measurementDate: string;
      progressPercentage?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_indicator_updates')
        .insert({
          indicator_id: indicatorId,
          measured_value: measuredValue,
          measurement_date: measurementDate,
          progress_percentage: progressPercentage || 0,
          notes: notes || null,
          updated_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['indicator-updates', variables.indicatorId] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      queryClient.invalidateQueries({ queryKey: ['approved-projects'] });
      toast.success('Indicador atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar indicador: ' + error.message);
    }
  });
}
