import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Circle, Clock, XCircle, Eye, PauseCircle, CheckCircle2 } from 'lucide-react';
import type { ProjectTask, TaskStatus } from '@/hooks/useProjectTasks';
import { useUpdateTask } from '@/hooks/useProjectTasks';
import { useCreateStatusHistory } from '@/hooks/useTaskStatusHistory';

interface TaskStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ProjectTask | null;
}

const STATUS_CONFIG = {
  not_started: { label: 'Não iniciada', icon: Circle, color: 'text-muted-foreground' },
  in_progress: { label: 'Em andamento', icon: Clock, color: 'text-blue-500' },
  blocked: { label: 'Bloqueada', icon: XCircle, color: 'text-red-500' },
  review: { label: 'Em revisão', icon: Eye, color: 'text-purple-500' },
  paused: { label: 'Pausada', icon: PauseCircle, color: 'text-orange-500' },
  completed: { label: 'Concluída', icon: CheckCircle2, color: 'text-green-500' }
};

export function TaskStatusUpdateDialog({ open, onOpenChange, task }: TaskStatusUpdateDialogProps) {
  const [newStatus, setNewStatus] = useState<TaskStatus | ''>('');
  const [notes, setNotes] = useState('');
  
  const updateTask = useUpdateTask();
  const createHistory = useCreateStatusHistory();

  useEffect(() => {
    if (open && task) {
      setNewStatus('');
      setNotes('');
    }
  }, [open, task]);

  if (!task) return null;

  const currentStatus = STATUS_CONFIG[task.status];
  const CurrentIcon = currentStatus.icon;

  const isNotesRequired = newStatus === 'blocked' || newStatus === 'paused';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStatus) {
      return;
    }

    if (isNotesRequired && !notes.trim()) {
      return;
    }

    try {
      // Update task status
      await updateTask.mutateAsync({
        taskId: task.id,
        projectId: task.project_id,
        status: newStatus as TaskStatus
      });

      // Create history entry
      await createHistory.mutateAsync({
        taskId: task.id,
        oldStatus: task.status,
        newStatus: newStatus as TaskStatus,
        notes: notes.trim() || undefined
      });

      onOpenChange(false);
    } catch (error) {
      // Errors are handled by the mutations
    }
  };

  const isLoading = updateTask.isPending || createHistory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atualizar Status da Tarefa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Tarefa:</p>
            <p className="text-sm text-muted-foreground">{task.title}</p>
          </div>

          <div className="space-y-2">
            <Label>Status Atual</Label>
            <div className={`flex items-center gap-2 p-3 rounded-md border ${currentStatus.color}`}>
              <CurrentIcon className="h-5 w-5" />
              <span className="font-medium">{currentStatus.label}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">Novo Status *</Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as TaskStatus)}>
              <SelectTrigger id="newStatus">
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={key} value={key} disabled={key === task.status}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notas sobre a mudança {isNotesRequired && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isNotesRequired
                  ? "Por favor, explique o motivo desta mudança de status..."
                  : "Adicione informações sobre a mudança de status (opcional)"
              }
              rows={4}
              required={isNotesRequired}
            />
            {isNotesRequired && (
              <p className="text-xs text-muted-foreground">
                Notas obrigatórias para status "Bloqueada" ou "Pausada"
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!newStatus || isLoading}>
              {isLoading ? 'Atualizando...' : 'Atualizar Status'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
