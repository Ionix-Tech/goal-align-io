import { useState } from "react";
import { Plus, Trash2, UserCircle, Calendar, Link2, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface TaskInput {
  id: string;
  title: string;              // O quê (obrigatório)
  assigned_to: string;        // Quem (obrigatório)
  start_date: string;         // Quando começa (obrigatório)
  due_date: string;           // Quando termina (obrigatório)
  description?: string;       // Observações (opcional)
  link_url?: string;          // Link/anexo (opcional)
  status: string;             // Status
}

interface ActionPlanTaskManagerProps {
  tasks: TaskInput[];
  onTasksChange: (tasks: TaskInput[]) => void;
  members: Array<{ id: string; full_name: string }>;
}

const statusOptions = [
  { value: 'not_started', label: 'Aberta' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluída' },
  { value: 'blocked', label: 'Bloqueada' },
];

const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    not_started: { label: 'Aberta', className: 'bg-muted text-muted-foreground' },
    in_progress: { label: 'Em andamento', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    completed: { label: 'Concluída', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    blocked: { label: 'Bloqueada', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  };
  return configs[status] || configs.not_started;
};

export function ActionPlanTaskManager({ tasks, onTasksChange, members }: ActionPlanTaskManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Omit<TaskInput, 'id'>>({
    title: "",
    assigned_to: "",
    start_date: "",
    due_date: "",
    description: "",
    link_url: "",
    status: "not_started",
  });

  const validateTask = () => {
    if (!currentTask.title.trim()) {
      toast.error("O quê (título) é obrigatório");
      return false;
    }
    if (!currentTask.assigned_to) {
      toast.error("Quem (responsável) é obrigatório");
      return false;
    }
    if (!currentTask.start_date) {
      toast.error("Quando começa é obrigatório");
      return false;
    }
    if (!currentTask.due_date) {
      toast.error("Quando termina é obrigatório");
      return false;
    }
    if (new Date(currentTask.start_date) > new Date(currentTask.due_date)) {
      toast.error("Data de início não pode ser posterior à data de término");
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!validateTask()) return;

    const newTask: TaskInput = {
      id: crypto.randomUUID(),
      ...currentTask,
    };

    onTasksChange([...tasks, newTask]);
    resetForm();
    setIsAdding(false);
    toast.success("Ação adicionada");
  };

  const handleUpdate = () => {
    if (!validateTask()) return;

    const updatedTasks = tasks.map(task =>
      task.id === editingId
        ? { ...task, ...currentTask }
        : task
    );

    onTasksChange(updatedTasks);
    resetForm();
    setEditingId(null);
    toast.success("Ação atualizada");
  };

  const handleEdit = (task: TaskInput) => {
    setCurrentTask({
      title: task.title,
      assigned_to: task.assigned_to,
      start_date: task.start_date,
      due_date: task.due_date,
      description: task.description || "",
      link_url: task.link_url || "",
      status: task.status,
    });
    setEditingId(task.id);
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onTasksChange(tasks.filter(task => task.id !== id));
    toast.success("Ação removida");
  };

  const resetForm = () => {
    setCurrentTask({
      title: "",
      assigned_to: "",
      start_date: "",
      due_date: "",
      description: "",
      link_url: "",
      status: "not_started",
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const getMemberName = (memberId: string) => {
    if (!memberId) return "Não atribuído";
    const member = members.find(m => m.id === memberId);
    return member?.full_name || "Não atribuído";
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          📋 Ações do Plano ({tasks.length})
        </h3>
        {!isAdding && !editingId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Ação
          </Button>
        )}
      </div>

      {/* Lista de ações */}
      <div className="space-y-2">
        {tasks.map(task => {
          const statusConfig = getStatusConfig(task.status);
          return (
            <div
              key={task.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{task.title}</div>
                    <Badge variant="outline" className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UserCircle className="h-3 w-3" />
                      {getMemberName(task.assigned_to)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.start_date), "dd/MM/yy", { locale: ptBR })}
                      <ArrowRight className="h-3 w-3" />
                      {format(new Date(task.due_date), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>

                  {task.description && (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3 mt-0.5" />
                      <span>{task.description}</span>
                    </div>
                  )}

                  {task.link_url && (
                    <div className="flex items-center gap-1 text-xs">
                      <Link2 className="h-3 w-3" />
                      <a 
                        href={task.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate max-w-[200px]"
                      >
                        {task.link_url}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(task)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(task.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma ação adicionada. Clique em "Adicionar Ação" para começar.
          </div>
        )}
      </div>

      {/* Formulário de adição/edição */}
      {(isAdding || editingId) && (
        <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
          {/* O quê (obrigatório) */}
          <div className="space-y-2">
            <Label>O quê (título) *</Label>
            <Input
              value={currentTask.title}
              onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
              placeholder="Ex: Revisar processo atual"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quem (obrigatório) */}
            <div className="space-y-2">
              <Label>Quem (responsável) *</Label>
              <Select
                value={currentTask.assigned_to || "unassigned"}
                onValueChange={(value) =>
                  setCurrentTask({
                    ...currentTask,
                    assigned_to: value === "unassigned" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned" disabled>Selecionar responsável</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={currentTask.status}
                onValueChange={(value) =>
                  setCurrentTask({ ...currentTask, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quando começa (obrigatório) */}
            <div className="space-y-2">
              <Label>Quando começa *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentTask.start_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {currentTask.start_date
                      ? format(new Date(currentTask.start_date), "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={currentTask.start_date ? new Date(currentTask.start_date) : undefined}
                    onSelect={(date) =>
                      setCurrentTask({
                        ...currentTask,
                        start_date: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quando termina (obrigatório) */}
            <div className="space-y-2">
              <Label>Quando termina *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentTask.due_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {currentTask.due_date
                      ? format(new Date(currentTask.due_date), "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={currentTask.due_date ? new Date(currentTask.due_date) : undefined}
                    onSelect={(date) =>
                      setCurrentTask({
                        ...currentTask,
                        due_date: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Observações (opcional) */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={currentTask.description || ""}
              onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
              placeholder="Detalhes adicionais sobre a ação..."
              rows={2}
            />
          </div>

          {/* Link/anexo (opcional) */}
          <div className="space-y-2">
            <Label>Link/Anexo (opcional)</Label>
            <Input
              type="url"
              value={currentTask.link_url || ""}
              onChange={(e) => setCurrentTask({ ...currentTask, link_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={editingId ? handleUpdate : handleAdd}>
              {editingId ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
