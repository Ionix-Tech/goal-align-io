import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskSummary {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  criticalTasks: Array<{
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    assignee: { full_name: string } | null;
  }>;
}

export interface MilestoneUpdateSummary {
  id: string;
  progress_percentage: number;
  is_critical: boolean;
  notes: string | null;
  updated_at: string;
  milestone: { title: string };
  updater: { full_name: string };
}

export interface IndicatorUpdateSummary {
  id: string;
  measured_value: string;
  progress_percentage: number;
  notes: string | null;
  measurement_date: string;
  indicator: { name: string; target_state: string; unit: string | null };
  updater: { full_name: string };
}

export interface A3ReportData {
  taskSummary: TaskSummary;
  milestoneUpdates: MilestoneUpdateSummary[];
  indicatorUpdates: IndicatorUpdateSummary[];
  weeklyUpdate: {
    health_status: string;
    progress_summary: string;
    challenges: string | null;
    next_steps: string | null;
    week_start_date: string;
    week_end_date: string;
  } | null;
}

export function useA3ReportData(projectId: string | null) {
  return useQuery({
    queryKey: ['a3-report-data', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // 1. Buscar tarefas
      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('*, assignee:profiles!project_tasks_assigned_to_fkey(full_name)')
        .eq('project_id', projectId);

      const now = new Date();
      const taskSummary: TaskSummary = {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'completed').length || 0,
        inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
        blocked: tasks?.filter(t => t.status === 'blocked').length || 0,
        overdue: tasks?.filter(t => 
          t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
        ).length || 0,
        criticalTasks: tasks?.filter(t => 
          t.status === 'blocked' || 
          (t.due_date && new Date(t.due_date) < now && t.status !== 'completed')
        ).map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          due_date: t.due_date,
          assignee: t.assignee
        })) || []
      };

      // 2. Buscar milestones do projeto primeiro
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('id')
        .eq('project_id', projectId);

      const milestoneIds = milestones?.map(m => m.id) || [];

      // 3. Buscar top 3 atualizações de milestones
      const { data: milestoneUpdates } = await supabase
        .from('project_milestone_updates')
        .select(`
          id,
          progress_percentage,
          is_critical,
          notes,
          updated_at,
          milestone:project_milestones(title),
          updater:profiles!project_milestone_updates_updated_by_fkey(full_name)
        `)
        .in('milestone_id', milestoneIds.length > 0 ? milestoneIds : [''])
        .order('updated_at', { ascending: false })
        .limit(3);

      // 4. Buscar indicadores do projeto primeiro
      const { data: indicators } = await supabase
        .from('project_indicators')
        .select('id')
        .eq('project_id', projectId);

      const indicatorIds = indicators?.map(i => i.id) || [];

      // 5. Buscar top 3 atualizações de indicadores
      const { data: indicatorUpdates } = await supabase
        .from('project_indicator_updates')
        .select(`
          id,
          measured_value,
          progress_percentage,
          notes,
          measurement_date,
          indicator:project_indicators(name, target_state, unit),
          updater:profiles!project_indicator_updates_updated_by_fkey(full_name)
        `)
        .in('indicator_id', indicatorIds.length > 0 ? indicatorIds : [''])
        .order('measurement_date', { ascending: false })
        .limit(3);

      // 6. Buscar último weekly update
      const { data: weeklyUpdate } = await supabase
        .from('project_weekly_updates')
        .select('health_status, progress_summary, challenges, next_steps, week_start_date, week_end_date')
        .eq('project_id', projectId)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        taskSummary,
        milestoneUpdates: (milestoneUpdates || []) as MilestoneUpdateSummary[],
        indicatorUpdates: (indicatorUpdates || []) as IndicatorUpdateSummary[],
        weeklyUpdate
      } as A3ReportData;
    },
    enabled: !!projectId
  });
}
