import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCreateIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      currentState,
      targetState,
      unit
    }: {
      projectId: string;
      name: string;
      currentState: string;
      targetState: string;
      unit?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_indicators')
        .insert({
          project_id: projectId,
          name,
          current_state: currentState,
          target_state: targetState,
          unit: unit || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.projectId] });
      toast.success('Indicador adicionado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar indicador: ' + error.message);
    }
  });
}
