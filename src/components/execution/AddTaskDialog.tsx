import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTask, useUpdateTask, ProjectTask } from '@/hooks/useProjectTasks';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  milestones: Array<{ id: string; title: string }>;
  indicators: Array<{ id: string; name: string }>;
  members: Array<{ user_id: string; user: { full_name: string } }>;
  editTask?: ProjectTask | null;
}

export function AddTaskDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  milestones, 
  indicators, 
  members,
  editTask 
}: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [priority, setPriority] = useState('medium');
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [indicatorId, setIndicatorId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setStatus(editTask.status);
      setPriority(editTask.priority);
      setMilestoneId(editTask.milestone_id || '');
      setIndicatorId(editTask.indicator_id || '');
      setAssignedTo(editTask.assigned_to || '');
      setDueDate(editTask.due_date || '');
    } else {
      resetForm();
    }
  }, [editTask, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('not_started');
    setPriority('medium');
    setMilestoneId('');
    setIndicatorId('');
    setAssignedTo('');
    setDueDate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    if (editTask) {
      await updateTask.mutateAsync({
        taskId: editTask.id,
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        milestoneId: milestoneId || undefined,
        indicatorId: indicatorId || undefined,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined
      });
    } else {
      await createTask.mutateAsync({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        milestoneId: milestoneId || undefined,
        indicatorId: indicatorId || undefined,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined
      });
    }

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTask ? 'Editar Tarefa' : 'Adicionar Tarefa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Revisar documentação técnica"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {editTask && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Não iniciada</SelectItem>
                    <SelectItem value="in_progress">Em progresso</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone">Vincular a Milestone (opcional)</Label>
            <Select value={milestoneId || undefined} onValueChange={setMilestoneId}>
              <SelectTrigger id="milestone">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {milestones.map((milestone) => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="indicator">Vincular a Indicador (opcional)</Label>
            <Select value={indicatorId || undefined} onValueChange={setIndicatorId}>
              <SelectTrigger id="indicator">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {indicators.map((indicator) => (
                  <SelectItem key={indicator.id} value={indicator.id}>
                    {indicator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Atribuir a</Label>
            <Select value={assignedTo || undefined} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Não atribuído" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de Vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
              {(createTask.isPending || updateTask.isPending) ? 'Salvando...' : editTask ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
