import { useState } from "react";
import { Plus, Trash2, UserCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface TaskInput {
  id: string;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
}

interface ActionPlanTaskManagerProps {
  tasks: TaskInput[];
  onTasksChange: (tasks: TaskInput[]) => void;
  members: Array<{ id: string; full_name: string }>;
}

export function ActionPlanTaskManager({ tasks, onTasksChange, members }: ActionPlanTaskManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Omit<TaskInput, 'id'>>({
    title: "",
    assigned_to: null,
    due_date: null,
  });

  const handleAdd = () => {
    if (!currentTask.title.trim()) {
      toast.error("Título da tarefa é obrigatório");
      return;
    }

    const newTask: TaskInput = {
      id: crypto.randomUUID(),
      ...currentTask,
    };

    onTasksChange([...tasks, newTask]);
    setCurrentTask({ title: "", assigned_to: null, due_date: null });
    setIsAdding(false);
    toast.success("Tarefa adicionada");
  };

  const handleUpdate = () => {
    if (!currentTask.title.trim()) {
      toast.error("Título da tarefa é obrigatório");
      return;
    }

    const updatedTasks = tasks.map(task =>
      task.id === editingId
        ? { ...task, ...currentTask }
        : task
    );

    onTasksChange(updatedTasks);
    setCurrentTask({ title: "", assigned_to: null, due_date: null });
    setEditingId(null);
    toast.success("Tarefa atualizada");
  };

  const handleEdit = (task: TaskInput) => {
    setCurrentTask({
      title: task.title,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
    });
    setEditingId(task.id);
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onTasksChange(tasks.filter(task => task.id !== id));
    toast.success("Tarefa removida");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setCurrentTask({ title: "", assigned_to: null, due_date: null });
  };

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return "Não atribuído";
    const member = members.find(m => m.id === memberId);
    return member?.full_name || "Não atribuído";
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          📋 Tarefas do Plano ({tasks.length})
        </h3>
        {!isAdding && !editingId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Tarefa
          </Button>
        )}
      </div>

      {/* Lista de tarefas */}
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="font-medium text-sm">{task.title}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UserCircle className="h-3 w-3" />
                    {getMemberName(task.assigned_to)}
                  </span>
                  {task.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
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
        ))}

        {tasks.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma tarefa adicionada. Clique em "Adicionar Tarefa" para começar.
          </div>
        )}
      </div>

      {/* Formulário de adição/edição */}
      {(isAdding || editingId) && (
        <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
          <div className="space-y-2">
            <Label>Título da Tarefa *</Label>
            <Input
              value={currentTask.title}
              onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
              placeholder="Ex: Revisar processo atual"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={currentTask.assigned_to || "unassigned"}
                onValueChange={(value) =>
                  setCurrentTask({
                    ...currentTask,
                    assigned_to: value === "unassigned" ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Não atribuído</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
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
                        due_date: date ? format(date, "yyyy-MM-dd") : null,
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
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
