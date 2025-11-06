import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SituationIndicator {
  id: string;
  situation_id: string;
  name: string;
  current_value: number;
  target_value: number;
  unit: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useSituationIndicators(situationId: string) {
  return useQuery({
    queryKey: ['situation-indicators', situationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('situation_indicators')
        .select('*')
        .eq('situation_id', situationId)
        .order('display_order');

      if (error) throw error;
      return data as SituationIndicator[];
    },
    enabled: !!situationId
  });
}

export function useCreateSituationIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      situationId,
      name,
      currentValue,
      targetValue,
      unit,
      displayOrder = 0
    }: {
      situationId: string;
      name: string;
      currentValue: number;
      targetValue: number;
      unit?: string;
      displayOrder?: number;
    }) => {
      const { data, error } = await supabase
        .from('situation_indicators')
        .insert({
          situation_id: situationId,
          name,
          current_value: currentValue,
          target_value: targetValue,
          unit: unit || null,
          display_order: displayOrder
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['situation-indicators', variables.situationId] });
      queryClient.invalidateQueries({ queryKey: ['project-situations'] });
      toast.success('Indicador adicionado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar indicador: ' + error.message);
    }
  });
}

export function useUpdateSituationIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      indicatorId,
      name,
      currentValue,
      targetValue,
      unit,
      displayOrder
    }: {
      indicatorId: string;
      name?: string;
      currentValue?: number;
      targetValue?: number;
      unit?: string;
      displayOrder?: number;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (currentValue !== undefined) updates.current_value = currentValue;
      if (targetValue !== undefined) updates.target_value = targetValue;
      if (unit !== undefined) updates.unit = unit || null;
      if (displayOrder !== undefined) updates.display_order = displayOrder;

      const { data, error } = await supabase
        .from('situation_indicators')
        .update(updates)
        .eq('id', indicatorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['situation-indicators', data.situation_id] });
      queryClient.invalidateQueries({ queryKey: ['project-situations'] });
      toast.success('Indicador atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar indicador: ' + error.message);
    }
  });
}

export function useDeleteSituationIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ indicatorId, situationId }: { indicatorId: string; situationId: string }) => {
      const { error } = await supabase
        .from('situation_indicators')
        .delete()
        .eq('id', indicatorId);

      if (error) throw error;
      return { situationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['situation-indicators', data.situationId] });
      queryClient.invalidateQueries({ queryKey: ['project-situations'] });
      toast.success('Indicador removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover indicador: ' + error.message);
    }
  });
}
