import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type HealthStatus = 'green' | 'amber' | 'red';

export interface ProjectHealthStatus {
  id: string;
  health_status: HealthStatus;
  reason: string | null;
  reported_by: string;
  reported_at: string;
  reporter: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useProjectHealth(projectId: string | null) {
  return useQuery({
    queryKey: ['project-health', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('project_health_status')
        .select(`
          id,
          health_status,
          reason,
          reported_by,
          reported_at,
          reporter:profiles!project_health_status_reported_by_fkey(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('reported_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as ProjectHealthStatus | null;
    },
    enabled: !!projectId
  });
}

export function useProjectHealthHistory(projectId: string | null) {
  return useQuery({
    queryKey: ['project-health-history', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_health_status')
        .select(`
          id,
          health_status,
          reason,
          reported_by,
          reported_at,
          reporter:profiles!project_health_status_reported_by_fkey(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('reported_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProjectHealthStatus[];
    },
    enabled: !!projectId
  });
}

export function useUpdateProjectHealth() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      healthStatus,
      reason
    }: {
      projectId: string;
      healthStatus: HealthStatus;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('project_health_status')
        .insert({
          project_id: projectId,
          health_status: healthStatus,
          reason: reason || null,
          reported_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-health', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-health-history', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['approved-projects'] });
      toast.success('Status de saúde atualizado');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status de saúde: ' + error.message);
    }
  });
}
