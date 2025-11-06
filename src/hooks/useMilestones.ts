import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      title,
      description,
      targetDate
    }: {
      projectId: string;
      title: string;
      description?: string;
      targetDate: string;
    }) => {
      const { data, error } = await supabase
        .from('project_milestones')
        .insert({
          project_id: projectId,
          title,
          description: description || null,
          target_date: targetDate
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-details', variables.projectId] });
      toast.success('Milestone adicionado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar milestone: ' + error.message);
    }
  });
}
