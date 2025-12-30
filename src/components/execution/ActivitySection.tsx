import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ListTodo, Activity, TrendingUp, Target, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProjectActivityLog, useUpcomingTasks } from "@/hooks/useProjectActivityLog";
import { cn } from "@/lib/utils";

interface ActivitySectionProps {
  projectId: string;
}

const STATUS_CONFIG = {
  not_started: { label: 'Não iniciado', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  blocked: { label: 'Bloqueado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
} as const;

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'text-muted-foreground' },
  medium: { label: 'Média', color: 'text-yellow-600 dark:text-yellow-400' },
  high: { label: 'Alta', color: 'text-red-600 dark:text-red-400' }
} as const;

export function ActivitySection({ projectId }: ActivitySectionProps) {
  const { data: activities, isLoading: loadingActivities } = useProjectActivityLog(projectId);
  const { data: upcomingTasks, isLoading: loadingTasks } = useUpcomingTasks(projectId);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'milestone_update':
        return <Target className="h-3.5 w-3.5 text-green-500" />;
      case 'indicator_update':
        return <TrendingUp className="h-3.5 w-3.5 text-blue-500" />;
      case 'task_status':
        return <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />;
      case 'task_created':
        return <ListTodo className="h-3.5 w-3.5 text-orange-500" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Próximas Tarefas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="h-4 w-4 text-primary" />
            Próximas Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTasks ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : upcomingTasks && upcomingTasks.length > 0 ? (
            <div className="space-y-2">
              {upcomingTasks.map(task => {
                const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_started;
                const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                
                return (
                  <div 
                    key={task.id} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      isOverdue && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.milestone_title && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {task.milestone_title}
                          </Badge>
                        )}
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      {task.due_date && (
                        <div className={cn(
                          "flex items-center gap-1 text-xs",
                          isOverdue ? "text-destructive" : "text-muted-foreground"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhuma tarefa pendente
            </div>
          )}
        </CardContent>
      </Card>

      {/* Últimas Atualizações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Últimas Atualizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingActivities ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-full bg-muted">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhuma atividade recente
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
