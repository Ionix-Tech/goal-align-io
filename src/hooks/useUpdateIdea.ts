import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProjectCategory } from '@/config/categories';

interface UpdateIdeaParams {
  id: string;
  name?: string;
  description?: string | null;
  category?: ProjectCategory | null;
  thesis_id?: string | null;
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateIdeaParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current idea data for edit log
      const { data: currentIdea } = await supabase
        .from('projects')
        .select('name, description, category, thesis_id')
        .eq('id', id)
        .single();

      // Update the idea
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log changes to edit log
      if (currentIdea) {
        const changes: Array<{ field: string; old: string | null; new: string | null }> = [];
        
        if (updates.name !== undefined && updates.name !== currentIdea.name) {
          changes.push({ field: 'name', old: currentIdea.name, new: updates.name });
        }
        if (updates.description !== undefined && updates.description !== currentIdea.description) {
          changes.push({ field: 'description', old: currentIdea.description, new: updates.description ?? null });
        }
        if (updates.category !== undefined && updates.category !== currentIdea.category) {
          changes.push({ field: 'category', old: currentIdea.category, new: updates.category ?? null });
        }
        if (updates.thesis_id !== undefined && updates.thesis_id !== currentIdea.thesis_id) {
          changes.push({ field: 'thesis_id', old: currentIdea.thesis_id, new: updates.thesis_id ?? null });
        }

        // Insert edit logs (ignore errors as this is secondary)
        for (const change of changes) {
          try {
            await supabase.from('project_edit_log').insert({
              project_id: id,
              edited_by: user.id,
              field_name: change.field,
              old_value: change.old,
              new_value: change.new
            });
          } catch {
            // Ignore edit log errors
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Ideia atualizada",
        description: "As alterações foram salvas com sucesso."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar ideia",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
