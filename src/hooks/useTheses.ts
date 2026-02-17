import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type ThesisType = Database['public']['Enums']['thesis_type'];

export interface Thesis {
  id: string;
  name: string;
  description: string | null;
  objective: string;
  year: number;
  period_start: string;
  period_end: string;
  thesis_type: ThesisType;
  pillar_id: string | null;
  is_active: boolean;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface UseThesesFilters {
  year?: number;
  type?: ThesisType;
  includeArchived?: boolean;
}

export function useTheses(filters?: UseThesesFilters) {
  return useQuery({
    queryKey: ['theses', filters],
    queryFn: async () => {
      let query = supabase
        .from('strategic_theses')
        .select(`
          *,
          created_by_profile:profiles!strategic_theses_created_by_fkey(full_name, avatar_url)
        `)
        .order('year', { ascending: false })
        .order('created_at', { ascending: false });

      if (!filters?.includeArchived) {
        query = query.eq('is_archived', false);
      }

      if (filters?.year) {
        query = query.eq('year', filters.year);
      }

      if (filters?.type) {
        query = query.eq('thesis_type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;

      const theses = data as Thesis[];

      // Enrich with kpi_count and project_count
      if (theses.length > 0) {
        const thesisIds = theses.map(t => t.id);

        const { data: kpiRows } = await supabase
          .from('kpis')
          .select('objective_id')
          .in('objective_id', thesisIds)
          .eq('is_active', true);

        const { data: projectRows } = await supabase
          .from('projects')
          .select('thesis_id')
          .in('thesis_id', thesisIds);

        const kpiCountMap: Record<string, number> = {};
        (kpiRows || []).forEach((k: any) => {
          kpiCountMap[k.objective_id] = (kpiCountMap[k.objective_id] || 0) + 1;
        });

        const projectCountMap: Record<string, number> = {};
        (projectRows || []).forEach((p: any) => {
          projectCountMap[p.thesis_id] = (projectCountMap[p.thesis_id] || 0) + 1;
        });

        return theses.map(t => ({
          ...t,
          kpi_count: kpiCountMap[t.id] || 0,
          project_count: projectCountMap[t.id] || 0,
        }));
      }

      return theses;
    }
  });
}

export function useCreateThesis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (thesis: Omit<Thesis, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_profile'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('strategic_theses')
        .insert({
          ...thesis,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theses'] });
      toast({
        title: "Objetivo criado",
        description: "O objetivo estratégico foi criado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar objetivo",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateThesis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Thesis> & { id: string }) => {
      const { data, error } = await supabase
        .from('strategic_theses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theses'] });
      toast({
        title: "Objetivo atualizado",
        description: "As alterações foram salvas com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar objetivo",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteThesis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há projetos vinculados
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('thesis_id', id)
        .limit(1);

      if (projects && projects.length > 0) {
        throw new Error('Não é possível excluir um objetivo com projetos vinculados. Arquive-o ao invés disso.');
      }

      const { error } = await supabase
        .from('strategic_theses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theses'] });
      toast({
        title: "Objetivo excluído",
        description: "O objetivo foi removido com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir objetivo",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
