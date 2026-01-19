import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectKPILink {
  id: string;
  project_id: string;
  kpi_id: string;
  linked_by: string;
  linked_at: string;
  notes: string | null;
  kpi?: {
    id: string;
    name: string;
    unit: string;
    direction: 'higher_better' | 'lower_better';
    kpi_type: 'strategic' | 'area' | 'control';
    monthly_values?: {
      month: number;
      year: number;
      status: 'green' | 'yellow' | 'red' | null;
      actual_value: number | null;
      target_value: number | null;
    }[];
  };
}

export function useProjectKPILinks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-kpi-links', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_kpi_links')
        .select(`
          *,
          kpi:kpis(
            id, name, unit, direction, kpi_type,
            monthly_values:kpi_monthly_values(month, year, status, actual_value, target_value)
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data as ProjectKPILink[];
    },
    enabled: !!projectId
  });
}

export function useLinkKPIToProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ project_id, kpi_id, notes }: { project_id: string; kpi_id: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('project_kpi_links')
        .insert({
          project_id,
          kpi_id,
          linked_by: user.id,
          notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-kpi-links', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['kpi-details'] });
      toast({
        title: "KPI vinculado",
        description: "O indicador foi vinculado ao projeto."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao vincular KPI",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUnlinkKPIFromProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from('project_kpi_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return project_id;
    },
    onSuccess: (project_id) => {
      queryClient.invalidateQueries({ queryKey: ['project-kpi-links', project_id] });
      queryClient.invalidateQueries({ queryKey: ['kpi-details'] });
      toast({
        title: "KPI desvinculado",
        description: "O indicador foi removido do projeto."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao desvincular KPI",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
