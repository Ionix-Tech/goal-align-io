import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, User } from "lucide-react";
import type { ProjectTask } from "@/hooks/useProjectTasks";

interface ActionMatrixProps {
  tasks: ProjectTask[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: { label: "Não iniciada", className: "bg-gray-500/10 text-gray-500" },
  in_progress: { label: "Em progresso", className: "bg-blue-500/10 text-blue-500" },
  completed: { label: "Concluída", className: "bg-green-500/10 text-green-500" },
  blocked: { label: "Bloqueada", className: "bg-red-500/10 text-red-500" },
  review: { label: "Em revisão", className: "bg-yellow-500/10 text-yellow-500" },
  paused: { label: "Pausada", className: "bg-orange-500/10 text-orange-500" },
};

type GroupBy = "date" | "responsible";

export function ActionMatrix({ tasks }: ActionMatrixProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("date");

  const grouped = groupTasks(tasks, groupBy);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Agrupar por:</span>
        <Button
          variant={groupBy === "date" ? "default" : "outline"}
          size="sm"
          onClick={() => setGroupBy("date")}
        >
          <CalendarDays className="h-3 w-3 mr-1" />
          Data
        </Button>
        <Button
          variant={groupBy === "responsible" ? "default" : "outline"}
          size="sm"
          onClick={() => setGroupBy("responsible")}
        >
          <User className="h-3 w-3 mr-1" />
          Responsável
        </Button>
      </div>

      {Object.entries(grouped).map(([key, groupTasks]) => (
        <Card key={key} className="p-4">
          <h4 className="text-sm font-semibold mb-3">{key}</h4>
          <div className="space-y-2">
            {groupTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.assignee && (
                      <span className="text-xs text-muted-foreground">
                        {task.assignee.full_name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.due_date).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {task.milestone && (
                      <Badge variant="outline" className="text-xs h-5">
                        {task.milestone.title}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge className={statusConfig[task.status]?.className || ""}>
                  {statusConfig[task.status]?.label || task.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma ação cadastrada.
        </p>
      )}
    </div>
  );
}

function groupTasks(tasks: ProjectTask[], groupBy: GroupBy): Record<string, ProjectTask[]> {
  const groups: Record<string, ProjectTask[]> = {};

  for (const task of tasks) {
    let key: string;
    if (groupBy === "date") {
      key = task.due_date
        ? new Date(task.due_date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
        : "Sem data";
    } else {
      key = task.assignee?.full_name || "Não atribuído";
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }

  // Sort groups by key
  const sorted: Record<string, ProjectTask[]> = {};
  for (const key of Object.keys(groups).sort()) {
    sorted[key] = groups[key];
  }
  return sorted;
}
