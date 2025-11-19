import { useState } from 'react';
import { ProjectTask } from '@/hooks/useProjectTasks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarDays, Flag, MoreVertical, CheckCircle2, Circle, Clock, XCircle, Eye, PauseCircle, History, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskStatusUpdateDialog } from './TaskStatusUpdateDialog';
import { TaskStatusHistoryDialog } from './TaskStatusHistoryDialog';
import { TaskDateHistoryDialog } from './TaskDateHistoryDialog';

interface TaskCardProps {
  task: ProjectTask;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [dateHistoryDialogOpen, setDateHistoryDialogOpen] = useState(false);

  const statusConfig = {
    not_started: { label: 'Não iniciada', icon: Circle, className: 'bg-muted text-muted-foreground' },
    in_progress: { label: 'Em progresso', icon: Clock, className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    blocked: { label: 'Bloqueada', icon: XCircle, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    review: { label: 'Em revisão', icon: Eye, className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    paused: { label: 'Pausada', icon: PauseCircle, className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    completed: { label: 'Concluída', icon: CheckCircle2, className: 'bg-green-500/10 text-green-500 border-green-500/20' }
  };

  const priorityConfig = {
    low: { label: 'Baixa', className: 'bg-gray-500/10 text-gray-500' },
    medium: { label: 'Média', className: 'bg-yellow-500/10 text-yellow-500' },
    high: { label: 'Alta', className: 'bg-red-500/10 text-red-500' }
  };

  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const StatusIcon = status.icon;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setStatusDialogOpen(true)}
              className="mt-1"
              title="Atualizar status"
            >
              <StatusIcon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </button>
            <div className="flex-1">
              <h4 className="font-medium leading-tight">{task.title}</h4>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            <Badge variant="outline" className={priority.className}>
              <Flag className="h-3 w-3 mr-1" />
              {priority.label}
            </Badge>
            {task.milestone && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                📍 {task.milestone.title}
              </Badge>
            )}
            {task.indicator && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                📊 {task.indicator.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {task.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                <CalendarDays className="h-4 w-4" />
                {format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                {isOverdue && ' (Atrasada)'}
              </div>
            )}
            {task.assignee && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{task.assignee.full_name}</span>
              </div>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
              Atualizar Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHistoryDialogOpen(true)}>
              <History className="h-4 w-4 mr-2" />
              Ver Histórico de Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateHistoryDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Ver Histórico de Datas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(task)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(task.id)}
              className="text-destructive"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TaskStatusUpdateDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        task={task}
      />

      <TaskStatusHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        taskId={task.id}
        taskTitle={task.title}
      />

      <TaskDateHistoryDialog
        open={dateHistoryDialogOpen}
        onOpenChange={setDateHistoryDialogOpen}
        taskId={task.id}
        taskTitle={task.title}
      />
    </Card>
  );
}
