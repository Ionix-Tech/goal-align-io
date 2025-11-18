import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ThesisKPI } from './useThesisDetails';

export function useCreateThesisKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (kpi: Omit<ThesisKPI, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('thesis_kpis')
        .insert(kpi)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['thesis-details', variables.thesis_id] });
      toast({
        title: "KPI adicionado",
        description: "O indicador foi adicionado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar KPI",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateThesisKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, thesis_id, ...updates }: Partial<ThesisKPI> & { id: string; thesis_id: string }) => {
      const { data, error } = await supabase
        .from('thesis_kpis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, thesis_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['thesis-details', result.thesis_id] });
      toast({
        title: "KPI atualizado",
        description: "As alterações foram salvas."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar KPI",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteThesisKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, thesis_id }: { id: string; thesis_id: string }) => {
      const { error } = await supabase
        .from('thesis_kpis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return thesis_id;
    },
    onSuccess: (thesis_id) => {
      queryClient.invalidateQueries({ queryKey: ['thesis-details', thesis_id] });
      toast({
        title: "KPI removido",
        description: "O indicador foi removido com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover KPI",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
