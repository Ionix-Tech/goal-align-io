import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UpdateMonthlyValueInput {
  id: string;
  kpi_id: string;
  target_value?: number | null;
  actual_value?: number | null;
  notes?: string | null;
}

export function useUpdateKPIMonthlyValue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, kpi_id, ...updates }: UpdateMonthlyValueInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('kpi_monthly_values')
        .update({
          ...updates,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, kpi_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-details', result.kpi_id] });
      toast({
        title: "Valor atualizado",
        description: "O valor mensal foi salvo com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar valor",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useBatchUpdateKPIMonthlyValues() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ kpi_id, values }: { kpi_id: string; values: Omit<UpdateMonthlyValueInput, 'kpi_id'>[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updates = values.map(async ({ id, ...updates }) => {
        const { error } = await supabase
          .from('kpi_monthly_values')
          .update({
            ...updates,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (error) throw error;
      });

      await Promise.all(updates);
      return kpi_id;
    },
    onSuccess: (kpi_id) => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-details', kpi_id] });
      toast({
        title: "Valores atualizados",
        description: "Todos os valores mensais foram salvos."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar valores",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
