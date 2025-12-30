import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useProjectTasks, useUpdateTask } from "@/hooks/useProjectTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AlertCircle, Calendar, Flag, Milestone } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface ProjectKanbanProps {
  projectId: string;
}

const columns = [
  { id: "not_started", title: "Não Iniciado", color: "bg-slate-400" },
  { id: "in_progress", title: "Em Progresso", color: "bg-amber-500" },
  { id: "blocked", title: "Bloqueado", color: "bg-red-500" },
  { id: "review", title: "Em Revisão", color: "bg-purple-500" },
  { id: "paused", title: "Pausado", color: "bg-gray-500" },
  { id: "completed", title: "Concluído", color: "bg-green-500" },
];

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "Alta", color: "text-red-500" },
  medium: { label: "Média", color: "text-amber-500" },
  low: { label: "Baixa", color: "text-green-500" },
};

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: any[];
  children: React.ReactNode;
}

function KanbanColumn({ id, title, color, tasks, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg",
        isOver && "ring-2 ring-primary/50"
      )}
    >
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", color)} />
          <h3 className="font-medium text-sm">{title}</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {children}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: any;
  isDragging?: boolean;
}

function TaskCard({ task, isDragging }: TaskCardProps) {
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <Card
      className={cn(
        "cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow",
        isDragging && "opacity-50 rotate-2 shadow-lg"
      )}
    >
      <CardContent className="p-3 space-y-2">
        <p className="font-medium text-sm line-clamp-2">{task.title}</p>

        <div className="flex flex-wrap gap-1">
          {/* Prioridade */}
          <div className={cn("flex items-center gap-1 text-xs", priority.color)}>
            <Flag className="h-3 w-3" />
            {priority.label}
          </div>

          {/* Data de entrega */}
          {task.due_date && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-500" : "text-muted-foreground"
              )}
            >
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </div>
          )}
        </div>

        {/* Milestone */}
        {task.milestone?.title && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Milestone className="h-3 w-3" />
            <span className="truncate">{task.milestone.title}</span>
          </div>
        )}

        {/* Responsável */}
        {task.assignee && (
          <div className="flex items-center gap-2 pt-1 border-t">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {task.assignee.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {task.assignee.full_name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DraggableTaskCard({ task }: { task: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

export function ProjectKanban({ projectId }: ProjectKanbanProps) {
  const { data: tasks, isLoading } = useProjectTasks(projectId);
  const updateTask = useUpdateTask();
  const [activeTask, setActiveTask] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = [];
    });

    tasks?.forEach((task) => {
      const status = task.status || "not_started";
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        grouped["not_started"].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks?.find((t) => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    const task = tasks?.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Check if the target is a valid column
    const isValidColumn = columns.some((col) => col.id === newStatus);
    if (!isValidColumn) return;

    updateTask.mutate({
      taskId,
      projectId,
      status: newStatus as any,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Carregando tarefas...
        </CardContent>
      </Card>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kanban de Tarefas</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          Nenhuma tarefa encontrada. Crie tarefas na aba "Atividades" para
          visualizá-las aqui.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Kanban de Tarefas
          <Badge variant="secondary">{tasks.length} tarefas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max pb-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={tasksByStatus[column.id]}
              >
                {tasksByStatus[column.id].map((task) => (
                  <DraggableTaskCard key={task.id} task={task} />
                ))}
              </KanbanColumn>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
