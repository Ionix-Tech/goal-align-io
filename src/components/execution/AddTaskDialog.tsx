import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTask, useUpdateTask, ProjectTask, TaskStatus } from '@/hooks/useProjectTasks';
import { toast } from 'sonner';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  milestones: Array<{ id: string; title: string }>;
  indicators: Array<{ id: string; name: string }>;
  members: Array<{ user_id: string; user: { full_name: string } }>;
  editTask?: ProjectTask | null;
  projectEndDate?: string;
}

export function AddTaskDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  milestones, 
  indicators, 
  members,
  editTask,
  projectEndDate
}: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [priority, setPriority] = useState('medium');
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [indicatorId, setIndicatorId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

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
      setStartDate(editTask.start_date || '');
      setLinkUrl(editTask.link_url || '');
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
    setStartDate('');
    setLinkUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!assignedTo) {
      toast.error("Selecione um responsável para a tarefa");
      return;
    }

    if (!dueDate) {
      toast.error("Selecione uma data de vencimento para a tarefa");
      return;
    }
    
    // Validação: data fim < data início
    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      toast.error("Data de início não pode ser posterior à data de término");
      return;
    }
    
    // Aviso se a tarefa ultrapassa o prazo do projeto (não bloqueia)
    if (projectEndDate && dueDate && dueDate > projectEndDate) {
      toast.warning("⚠️ Esta tarefa termina DEPOIS do prazo final do projeto/plano");
    }

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
        dueDate: dueDate || undefined,
        startDate: startDate || undefined,
        linkUrl: linkUrl || undefined
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
        dueDate: dueDate || undefined,
        startDate: startDate || undefined,
        linkUrl: linkUrl || undefined
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
            <Label htmlFor="description">Descrição (opcional)</Label>
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
            <SelectItem value="blocked">Bloqueada</SelectItem>
            <SelectItem value="review">Em revisão</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
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
            <Label htmlFor="assignedTo">Responsável *</Label>
            <Select value={assignedTo || undefined} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Selecione um responsável" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início (opcional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento (opcional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl" className="text-xs text-muted-foreground">Link de Referência (opcional)</Label>
            <Input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm"
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
