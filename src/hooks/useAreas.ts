import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Area {
  id: string;
  name: string;
  code: string;
  description: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  manager?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select(`
          *,
          manager:profiles!areas_manager_id_fkey(id, full_name, email)
        `)
        .order('name');

      if (error) throw error;
      return data as Area[];
    }
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (area: { name: string; code: string; description?: string; manager_id?: string }) => {
      const { data, error } = await supabase
        .from('areas')
        .insert(area)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({
        title: "Área criada",
        description: "A área foi criada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar área",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; code?: string; description?: string; manager_id?: string | null; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('areas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({
        title: "Área atualizada",
        description: "As alterações foram salvas."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar área",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({
        title: "Área removida",
        description: "A área foi removida com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover área",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
