import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Circle, Clock, XCircle, Eye, PauseCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTaskStatusHistory } from '@/hooks/useTaskStatusHistory';
import type { TaskStatus } from '@/hooks/useProjectTasks';

interface TaskStatusHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  taskTitle?: string;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: any; color: string }> = {
  not_started: { label: 'Não iniciada', icon: Circle, color: 'text-muted-foreground' },
  in_progress: { label: 'Em andamento', icon: Clock, color: 'text-blue-500' },
  blocked: { label: 'Bloqueada', icon: XCircle, color: 'text-red-500' },
  review: { label: 'Em revisão', icon: Eye, color: 'text-purple-500' },
  paused: { label: 'Pausada', icon: PauseCircle, color: 'text-orange-500' },
  completed: { label: 'Concluída', icon: CheckCircle2, color: 'text-green-500' }
};

export function TaskStatusHistoryDialog({ 
  open, 
  onOpenChange, 
  taskId,
  taskTitle 
}: TaskStatusHistoryDialogProps) {
  const { data: history = [], isLoading } = useTaskStatusHistory(taskId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Status</DialogTitle>
          {taskTitle && (
            <p className="text-sm text-muted-foreground mt-1">{taskTitle}</p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando histórico...
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma mudança de status registrada ainda.
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {history.map((entry, index) => {
              const NewStatusIcon = STATUS_CONFIG[entry.new_status].icon;
              const OldStatusIcon = entry.old_status ? STATUS_CONFIG[entry.old_status].icon : null;
              
              return (
                <div key={entry.id} className="relative">
                  {/* Timeline line */}
                  {index < history.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  <div className="flex gap-4">
                    {/* Status icon */}
                    <div className="relative flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-card">
                        <NewStatusIcon className={`h-5 w-5 ${STATUS_CONFIG[entry.new_status].color}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2 pb-4">
                      {/* Status change */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.old_status && (
                          <>
                            {OldStatusIcon && (
                              <div className="flex items-center gap-1.5">
                                <OldStatusIcon className={`h-4 w-4 ${STATUS_CONFIG[entry.old_status].color}`} />
                                <span className="text-sm text-muted-foreground">
                                  {STATUS_CONFIG[entry.old_status].label}
                                </span>
                              </div>
                            )}
                            <span className="text-muted-foreground">→</span>
                          </>
                        )}
                        <div className="flex items-center gap-1.5">
                          <NewStatusIcon className={`h-4 w-4 ${STATUS_CONFIG[entry.new_status].color}`} />
                          <span className={`font-medium ${STATUS_CONFIG[entry.new_status].color}`}>
                            {STATUS_CONFIG[entry.new_status].label}
                          </span>
                        </div>
                      </div>

                      {/* User and date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={entry.changer.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {entry.changer.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>Por: {entry.changer.full_name}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(entry.changed_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>

                      {/* Notes */}
                      {entry.notes && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">{entry.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
