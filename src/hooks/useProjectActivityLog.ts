import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogItem {
  id: string;
  type: 'milestone_update' | 'indicator_update' | 'task_status' | 'task_created';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    progress?: number;
    value?: string;
    status?: string;
    milestone_title?: string;
    indicator_name?: string;
    task_title?: string;
  };
}

export function useProjectActivityLog(projectId: string | null) {
  return useQuery({
    queryKey: ['project-activity-log', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Buscar milestones do projeto para mapear IDs
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('id, title')
        .eq('project_id', projectId);

      // Buscar indicators do projeto para mapear IDs  
      const { data: indicators } = await supabase
        .from('project_indicators')
        .select('id, name')
        .eq('project_id', projectId);

      const milestoneMap = new Map(milestones?.map(m => [m.id, m.title]) || []);
      const indicatorMap = new Map(indicators?.map(i => [i.id, i.name]) || []);

      // Buscar dados em paralelo
      const [
        { data: milestoneUpdates },
        { data: indicatorUpdates },
        { data: taskStatusHistory },
        { data: recentTasks }
      ] = await Promise.all([
        // Atualizações de milestones
        supabase
          .from('project_milestone_updates')
          .select('id, milestone_id, progress_percentage, notes, updated_at')
          .in('milestone_id', milestones?.map(m => m.id) || [])
          .order('updated_at', { ascending: false })
          .limit(10),
        
        // Atualizações de indicadores
        supabase
          .from('project_indicator_updates')
          .select('id, indicator_id, measured_value, progress_percentage, measurement_date, notes')
          .in('indicator_id', indicators?.map(i => i.id) || [])
          .order('measurement_date', { ascending: false })
          .limit(10),
        
        // Histórico de status de tarefas
        supabase
          .from('task_status_history')
          .select(`
            id, 
            task_id, 
            old_status, 
            new_status, 
            changed_at,
            project_tasks!inner(title, project_id)
          `)
          .eq('project_tasks.project_id', projectId)
          .order('changed_at', { ascending: false })
          .limit(10),
        
        // Tarefas criadas recentemente
        supabase
          .from('project_tasks')
          .select('id, title, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const activities: ActivityLogItem[] = [];

      // Processar milestone updates
      milestoneUpdates?.forEach(update => {
        const milestoneTitle = milestoneMap.get(update.milestone_id) || 'Milestone';
        activities.push({
          id: `milestone-${update.id}`,
          type: 'milestone_update',
          title: `${milestoneTitle}`,
          description: update.notes || `Progresso atualizado para ${update.progress_percentage}%`,
          timestamp: update.updated_at,
          metadata: {
            progress: update.progress_percentage,
            milestone_title: milestoneTitle
          }
        });
      });

      // Processar indicator updates
      indicatorUpdates?.forEach(update => {
        const indicatorName = indicatorMap.get(update.indicator_id) || 'Indicador';
        activities.push({
          id: `indicator-${update.id}`,
          type: 'indicator_update',
          title: `${indicatorName}`,
          description: `Medição: ${update.measured_value}`,
          timestamp: update.measurement_date,
          metadata: {
            value: update.measured_value,
            progress: update.progress_percentage,
            indicator_name: indicatorName
          }
        });
      });

      // Processar task status changes
      taskStatusHistory?.forEach(history => {
        const taskInfo = history.project_tasks as any;
        if (taskInfo && history.new_status === 'completed') {
          activities.push({
            id: `task-status-${history.id}`,
            type: 'task_status',
            title: taskInfo.title,
            description: `Tarefa concluída`,
            timestamp: history.changed_at,
            metadata: {
              status: history.new_status,
              task_title: taskInfo.title
            }
          });
        }
      });

      // Ordenar por data mais recente
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return activities.slice(0, 10);
    },
    enabled: !!projectId
  });
}

// Hook para próximas tarefas
export function useUpcomingTasks(projectId: string | null) {
  return useQuery({
    queryKey: ['project-upcoming-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          id,
          title,
          status,
          due_date,
          priority,
          milestone_id,
          project_milestones(title)
        `)
        .eq('project_id', projectId)
        .neq('status', 'completed')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5);

      if (error) throw error;
      
      return data.map(task => ({
        ...task,
        milestone_title: (task.project_milestones as any)?.title || null
      }));
    },
    enabled: !!projectId
  });
}
