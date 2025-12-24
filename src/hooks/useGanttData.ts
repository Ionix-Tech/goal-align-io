import { useMemo } from 'react';
import { useProjectTasks, ProjectTask, TaskStatus } from './useProjectTasks';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: TaskStatus;
  progress: number;
  assignee?: string;
  milestoneName?: string;
  milestoneId?: string | null;
  priority: string;
  isOverdue: boolean;
}

// Calcula progresso baseado no status
function getProgressByStatus(status: TaskStatus): number {
  switch (status) {
    case 'completed': return 100;
    case 'review': return 90;
    case 'in_progress': return 50;
    case 'paused': return 30;
    case 'blocked': return 20;
    case 'not_started': return 0;
    default: return 0;
  }
}

export function useGanttData(projectId: string | null) {
  const { data: tasks, isLoading } = useProjectTasks(projectId);
  
  const ganttTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const today = startOfDay(new Date());
    
    return tasks.map((task): GanttTask => {
      // Se não tem start_date, usa created_at
      const startDate = task.start_date 
        ? new Date(task.start_date) 
        : new Date(task.created_at);
      
      // Se não tem due_date, usa startDate + 7 dias
      const endDate = task.due_date 
        ? new Date(task.due_date) 
        : addDays(startDate, 7);
      
      // Verifica se está atrasada (passou do prazo e não está completa)
      const isOverdue = task.status !== 'completed' && 
        task.due_date && 
        isBefore(new Date(task.due_date), today);
      
      return {
        id: task.id,
        title: task.title,
        startDate,
        endDate,
        status: task.status as TaskStatus,
        progress: getProgressByStatus(task.status as TaskStatus),
        assignee: task.assignee?.full_name,
        milestoneName: task.milestone?.title,
        milestoneId: task.milestone_id,
        priority: task.priority,
        isOverdue: !!isOverdue
      };
    });
  }, [tasks]);
  
  // Calcula o range de datas do projeto
  const dateRange = useMemo(() => {
    if (!ganttTasks || ganttTasks.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: addDays(today, 30)
      };
    }
    
    const allDates = ganttTasks.flatMap(t => [t.startDate, t.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Adiciona margem de 3 dias nas pontas
    return {
      minDate: addDays(minDate, -3),
      maxDate: addDays(maxDate, 3)
    };
  }, [ganttTasks]);

  // Agrupa tarefas por milestone
  const tasksByMilestone = useMemo(() => {
    const grouped: Record<string, GanttTask[]> = {};
    const noMilestone: GanttTask[] = [];
    
    ganttTasks.forEach(task => {
      if (task.milestoneId && task.milestoneName) {
        if (!grouped[task.milestoneName]) {
          grouped[task.milestoneName] = [];
        }
        grouped[task.milestoneName].push(task);
      } else {
        noMilestone.push(task);
      }
    });
    
    return { grouped, noMilestone };
  }, [ganttTasks]);

  return { 
    ganttTasks, 
    dateRange, 
    tasksByMilestone,
    isLoading,
    isEmpty: !tasks || tasks.length === 0
  };
}
