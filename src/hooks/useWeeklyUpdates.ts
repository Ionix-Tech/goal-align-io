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
  challenges: string | null;
  key_initiatives: string | null;
  results_achieved: string | null;
  blockers: string | null;
  next_week_focus: string | null;
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
      challenges,
      keyInitiatives,
      resultsAchieved,
      blockers,
      nextWeekFocus
    }: {
      projectId: string;
      weekStartDate: string;
      weekEndDate: string;
      healthStatus: HealthStatus;
      challenges?: string;
      keyInitiatives?: string;
      resultsAchieved?: string;
      blockers?: string;
      nextWeekFocus?: string;
    }) => {
      const { data, error} = await supabase
        .from('project_weekly_updates')
        .insert({
          project_id: projectId,
          week_start_date: weekStartDate,
          week_end_date: weekEndDate,
          health_status: healthStatus,
          challenges: challenges || null,
          key_initiatives: keyInitiatives || null,
          results_achieved: resultsAchieved || null,
          blockers: blockers || null,
          next_week_focus: nextWeekFocus || null,
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
      challenges,
      keyInitiatives,
      resultsAchieved,
      blockers,
      nextWeekFocus
    }: {
      updateId: string;
      projectId: string;
      healthStatus?: HealthStatus;
      challenges?: string;
      keyInitiatives?: string;
      resultsAchieved?: string;
      blockers?: string;
      nextWeekFocus?: string;
    }) => {
      const updateData: any = {};
      if (healthStatus !== undefined) updateData.health_status = healthStatus;
      if (challenges !== undefined) updateData.challenges = challenges;
      if (keyInitiatives !== undefined) updateData.key_initiatives = keyInitiatives;
      if (resultsAchieved !== undefined) updateData.results_achieved = resultsAchieved;
      if (blockers !== undefined) updateData.blockers = blockers;
      if (nextWeekFocus !== undefined) updateData.next_week_focus = nextWeekFocus;

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
