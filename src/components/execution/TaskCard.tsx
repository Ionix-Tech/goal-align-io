import { useState } from 'react';
import { ProjectTask } from '@/hooks/useProjectTasks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarDays, Flag, MoreVertical, CheckCircle2, Circle, Clock, XCircle, Eye, PauseCircle, History, Calendar, Link2, AlertCircle } from 'lucide-react';
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

  const getDaysInfo = () => {
    if (!task.due_date || task.status === 'completed') return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return { 
        text: `${absDays} dia${absDays > 1 ? 's' : ''} de atraso`, 
        className: 'text-red-500 font-medium',
        icon: AlertCircle
      };
    } else if (diffDays === 0) {
      return { 
        text: 'Vence hoje!', 
        className: 'text-amber-500 font-medium',
        icon: Clock
      };
    } else if (diffDays <= 3) {
      return { 
        text: `${diffDays} dia${diffDays > 1 ? 's' : ''} restante${diffDays > 1 ? 's' : ''}`, 
        className: 'text-amber-500',
        icon: Clock
      };
    } else {
      return { 
        text: `${diffDays} dias restantes`, 
        className: 'text-muted-foreground',
        icon: null
      };
    }
  };

  const daysInfo = getDaysInfo();
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Lado Esquerdo - Conteúdo principal */}
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

          {task.link_url && (
            <a 
              href={task.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Link2 className="h-4 w-4" />
              <span>Ver link</span>
            </a>
          )}
        </div>

        {/* Lado Direito - Destaque Responsável e Prazo */}
        <div className="flex flex-col items-end justify-between border-l pl-4 min-w-[160px]">
          {/* Responsável */}
          {task.assignee && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Responsável
              </span>
              <div className="flex items-center gap-2 mt-1 justify-end">
                <span className="text-sm font-medium">{task.assignee.full_name}</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          )}

          {/* Prazo */}
          {task.due_date && (
            <div className="text-right mt-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Prazo
              </span>
              <div className={`text-sm font-medium mt-1 flex items-center justify-end gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <CalendarDays className="h-4 w-4" />
                {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              {daysInfo && (
                <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${daysInfo.className}`}>
                  {daysInfo.icon && <daysInfo.icon className="h-3 w-3" />}
                  {daysInfo.text}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu de ações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
