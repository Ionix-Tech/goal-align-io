import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type HealthStatus = 'green' | 'amber' | 'red';

export interface WeeklyUpdate {
  id: string;
  project_id: string;
  week_start_date: string;
  week_end_date: string;
  health_status: HealthStatus;
  progress_summary: string;
  challenges: string | null;
  next_steps: string | null;
  key_metrics: any | null;
  submitted_by: string;
  submitted_at: string;
  submitter: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useWeeklyUpdates(projectId: string | null) {
  return useQuery({
    queryKey: ['weekly-updates', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_weekly_updates')
        .select(`
          *,
          submitter:profiles!project_weekly_updates_submitted_by_fkey(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('week_start_date', { ascending: false });

      if (error) throw error;
      return (data || []) as WeeklyUpdate[];
    },
    enabled: !!projectId
  });
}

export function useCreateWeeklyUpdate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      weekStartDate,
      weekEndDate,
      healthStatus,
      progressSummary,
      challenges,
      nextSteps,
      keyMetrics
    }: {
      projectId: string;
      weekStartDate: string;
      weekEndDate: string;
      healthStatus: HealthStatus;
      progressSummary: string;
      challenges?: string;
      nextSteps?: string;
      keyMetrics?: any;
    }) => {
      const { data, error} = await supabase
        .from('project_weekly_updates')
        .insert({
          project_id: projectId,
          week_start_date: weekStartDate,
          week_end_date: weekEndDate,
          health_status: healthStatus,
          progress_summary: progressSummary,
          challenges: challenges || null,
          next_steps: nextSteps || null,
          key_metrics: keyMetrics || null,
          submitted_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-updates', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['approved-projects'] });
      toast.success('Update semanal adicionado');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar update: ' + error.message);
    }
  });
}

export function useUpdateWeeklyUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updateId,
      projectId,
      healthStatus,
      progressSummary,
      challenges,
      nextSteps,
      keyMetrics
    }: {
      updateId: string;
      projectId: string;
      healthStatus?: HealthStatus;
      progressSummary?: string;
      challenges?: string;
      nextSteps?: string;
      keyMetrics?: any;
    }) => {
      const updateData: any = {};
      if (healthStatus !== undefined) updateData.health_status = healthStatus;
      if (progressSummary !== undefined) updateData.progress_summary = progressSummary;
      if (challenges !== undefined) updateData.challenges = challenges;
      if (nextSteps !== undefined) updateData.next_steps = nextSteps;
      if (keyMetrics !== undefined) updateData.key_metrics = keyMetrics;

      const { data, error } = await supabase
        .from('project_weekly_updates')
        .update(updateData)
        .eq('id', updateId)
        .select()
        .single();

      if (error) throw error;
      return { data, projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-updates', result.projectId] });
      toast.success('Update semanal atualizado');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar update: ' + error.message);
    }
  });
}
