import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGanttData, GanttTask } from '@/hooks/useGanttData';
import { format, differenceInDays, eachDayOfInterval, isToday, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AlertCircle, Calendar, User } from 'lucide-react';

interface GanttChartProps {
  projectId: string;
  onTaskClick?: (taskId: string) => void;
}

type GroupBy = 'none' | 'milestone' | 'status' | 'assignee';

const statusConfig: Record<string, { color: string; label: string; bgClass: string }> = {
  not_started: { color: 'bg-slate-400', label: 'Não iniciado', bgClass: 'bg-slate-400/20' },
  in_progress: { color: 'bg-amber-500', label: 'Em progresso', bgClass: 'bg-amber-500/20' },
  blocked: { color: 'bg-red-500', label: 'Bloqueado', bgClass: 'bg-red-500/20' },
  review: { color: 'bg-purple-500', label: 'Em revisão', bgClass: 'bg-purple-500/20' },
  paused: { color: 'bg-gray-500', label: 'Pausado', bgClass: 'bg-gray-500/20' },
  completed: { color: 'bg-green-500', label: 'Concluído', bgClass: 'bg-green-500/20' }
};

export function GanttChart({ projectId, onTaskClick }: GanttChartProps) {
  const { ganttTasks, dateRange, tasksByMilestone, isLoading, isEmpty } = useGanttData(projectId);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  // Gera os dias do intervalo
  const days = useMemo(() => {
    if (!dateRange.minDate || !dateRange.maxDate) return [];
    return eachDayOfInterval({ start: dateRange.minDate, end: dateRange.maxDate });
  }, [dateRange]);

  const totalDays = days.length;
  const dayWidth = 100 / totalDays;

  // Calcula a posição e largura de uma barra
  const getBarStyle = (task: GanttTask) => {
    const startOffset = differenceInDays(task.startDate, dateRange.minDate);
    const duration = differenceInDays(task.endDate, task.startDate) + 1;
    
    return {
      left: `${startOffset * dayWidth}%`,
      width: `${Math.max(duration * dayWidth, dayWidth)}%`
    };
  };

  // Posição da linha "hoje"
  const todayPosition = useMemo(() => {
    const today = startOfDay(new Date());
    const offset = differenceInDays(today, dateRange.minDate);
    if (offset < 0 || offset > totalDays) return null;
    return `${offset * dayWidth}%`;
  }, [dateRange, dayWidth, totalDays]);

  // Agrupa as tarefas conforme seleção
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ name: null, tasks: ganttTasks }];
    }
    
    if (groupBy === 'milestone') {
      const groups: Array<{ name: string | null; tasks: GanttTask[] }> = [];
      Object.entries(tasksByMilestone.grouped).forEach(([name, tasks]) => {
        groups.push({ name, tasks });
      });
      if (tasksByMilestone.noMilestone.length > 0) {
        groups.push({ name: 'Sem Milestone', tasks: tasksByMilestone.noMilestone });
      }
      return groups;
    }
    
    if (groupBy === 'status') {
      const byStatus: Record<string, GanttTask[]> = {};
      ganttTasks.forEach(task => {
        const status = statusConfig[task.status]?.label || task.status;
        if (!byStatus[status]) byStatus[status] = [];
        byStatus[status].push(task);
      });
      return Object.entries(byStatus).map(([name, tasks]) => ({ name, tasks }));
    }
    
    if (groupBy === 'assignee') {
      const byAssignee: Record<string, GanttTask[]> = {};
      ganttTasks.forEach(task => {
        const assignee = task.assignee || 'Não atribuído';
        if (!byAssignee[assignee]) byAssignee[assignee] = [];
        byAssignee[assignee].push(task);
      });
      return Object.entries(byAssignee).map(([name, tasks]) => ({ name, tasks }));
    }
    
    return [{ name: null, tasks: ganttTasks }];
  }, [ganttTasks, groupBy, tasksByMilestone]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Carregando cronograma...
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma tarefa cadastrada neste projeto.</p>
          <p className="text-sm mt-1">Adicione tarefas na aba "Atualizações" para visualizar o cronograma.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📊 Cronograma de Tarefas
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Legenda de status */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              {Object.entries(statusConfig).slice(0, 4).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={cn("w-3 h-3 rounded", config.color)} />
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>
            
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Agrupar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem agrupamento</SelectItem>
                <SelectItem value="milestone">Por Milestone</SelectItem>
                <SelectItem value="status">Por Status</SelectItem>
                <SelectItem value="assignee">Por Responsável</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header com datas */}
            <div className="flex border-b bg-muted/30 sticky top-0 z-10">
              <div className="w-64 shrink-0 p-3 font-medium text-sm border-r">
                Tarefa
              </div>
              <div className="flex-1 relative">
                <div className="flex">
                  {days.map((day, index) => (
                    <div
                      key={index}
                      style={{ width: `${dayWidth}%` }}
                      className={cn(
                        "text-center text-xs py-2 border-r border-border/30",
                        isToday(day) && "bg-primary/10 font-bold"
                      )}
                    >
                      <div className="text-muted-foreground">
                        {format(day, 'dd', { locale: ptBR })}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Corpo do Gantt */}
            <TooltipProvider>
              {groupedTasks.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Header do grupo */}
                  {group.name && (
                    <div className="flex border-b bg-muted/50">
                      <div className="w-64 shrink-0 p-2 px-3 font-semibold text-sm text-muted-foreground flex items-center gap-2">
                        {groupBy === 'milestone' && '🎯'}
                        {groupBy === 'status' && '📌'}
                        {groupBy === 'assignee' && <User className="h-4 w-4" />}
                        {group.name}
                        <Badge variant="secondary" className="text-xs">
                          {group.tasks.length}
                        </Badge>
                      </div>
                      <div className="flex-1" />
                    </div>
                  )}
                  
                  {/* Linhas das tarefas */}
                  {group.tasks.map((task) => {
                    const config = statusConfig[task.status] || statusConfig.not_started;
                    const barStyle = getBarStyle(task);
                    
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex border-b hover:bg-muted/30 transition-colors cursor-pointer",
                          task.isOverdue && "bg-red-50 dark:bg-red-950/20"
                        )}
                        onClick={() => onTaskClick?.(task.id)}
                      >
                        {/* Nome da tarefa */}
                        <div className="w-64 shrink-0 p-3 border-r">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate flex items-center gap-1">
                                {task.isOverdue && (
                                  <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                                )}
                                {task.title}
                              </p>
                              {task.assignee && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {task.assignee}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Área do gráfico */}
                        <div className="flex-1 relative py-2">
                          {/* Linhas de grade verticais */}
                          <div className="absolute inset-0 flex pointer-events-none">
                            {days.map((day, idx) => (
                              <div
                                key={idx}
                                style={{ width: `${dayWidth}%` }}
                                className={cn(
                                  "border-r border-border/10",
                                  isToday(day) && "bg-primary/5"
                                )}
                              />
                            ))}
                          </div>
                          
                          {/* Barra da tarefa */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute top-2 h-7 rounded-md transition-all",
                                  config.color,
                                  task.isOverdue && "ring-2 ring-destructive ring-offset-1"
                                )}
                                style={{
                                  ...barStyle,
                                  minWidth: '20px'
                                }}
                              >
                                {/* Barra de progresso interna */}
                                <div
                                  className="absolute inset-y-0 left-0 bg-white/20 rounded-l-md"
                                  style={{ width: `${task.progress}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium px-2 truncate">
                                  {task.progress}%
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{task.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(task.startDate, 'dd/MM/yyyy')} → {format(task.endDate, 'dd/MM/yyyy')}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {config.label}
                                  </Badge>
                                  {task.isOverdue && (
                                    <Badge variant="destructive" className="text-xs">
                                      Atrasado
                                    </Badge>
                                  )}
                                </div>
                                {task.milestoneName && (
                                  <p className="text-xs">
                                    🎯 {task.milestoneName}
                                  </p>
                                )}
                                {task.assignee && (
                                  <p className="text-xs">
                                    👤 {task.assignee}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                          
                          {/* Linha do "hoje" */}
                          {todayPosition && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 pointer-events-none"
                              style={{ left: todayPosition }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>
        
        {/* Footer com resumo */}
        <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Total: <strong>{ganttTasks.length}</strong> tarefas
            </span>
            <span className="text-muted-foreground">
              Concluídas: <strong>{ganttTasks.filter(t => t.status === 'completed').length}</strong>
            </span>
            {ganttTasks.filter(t => t.isOverdue).length > 0 && (
              <span className="text-destructive">
                Atrasadas: <strong>{ganttTasks.filter(t => t.isOverdue).length}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-0.5 bg-destructive" />
            <span>Linha do tempo atual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
