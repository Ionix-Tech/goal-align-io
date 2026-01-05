import { useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Target, Flag, TrendingUp, AlertCircle, CheckCircle2, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequirementTaskLinks } from "@/hooks/useRequirements";
import { ProjectTask } from "@/hooks/useProjectTasks";
import { ProjectRequirement } from "@/hooks/useRequirements";

interface Milestone {
  id: string;
  title: string;
  milestone_type?: string | null;
}

interface Indicator {
  id: string;
  name: string;
}

interface TaskMatrixViewProps {
  projectId: string;
  tasks: ProjectTask[];
  requirements: ProjectRequirement[];
  milestones: Milestone[];
  indicators: Indicator[];
}

interface TaskGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  tasks: ProjectTask[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  not_started: { label: "Não Iniciado", icon: <Circle className="h-3 w-3" />, className: "bg-muted text-muted-foreground" },
  todo: { label: "A Fazer", icon: <Circle className="h-3 w-3" />, className: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em Andamento", icon: <Clock className="h-3 w-3" />, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Concluído", icon: <CheckCircle2 className="h-3 w-3" />, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  blocked: { label: "Bloqueado", icon: <AlertCircle className="h-3 w-3" />, className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function TaskMatrixView({ projectId, tasks, requirements, milestones, indicators }: TaskMatrixViewProps) {
  const [groupBy, setGroupBy] = useState<"requirements" | "milestones" | "indicators">("requirements");
  const { data: requirementLinks } = useRequirementTaskLinks(projectId);

  // Map task_id -> requirement_ids
  const taskRequirementsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    requirementLinks?.forEach(link => {
      const reqIds = map.get(link.task_id) || [];
      reqIds.push(link.requirement_id);
      map.set(link.task_id, reqIds);
    });
    return map;
  }, [requirementLinks]);

  const groupedTasks = useMemo((): TaskGroup[] => {
    const groups: TaskGroup[] = [];

    if (groupBy === "requirements") {
      // Group by requirements
      const reqMap = new Map<string, ProjectTask[]>();
      const orphanTasks: ProjectTask[] = [];

      tasks.forEach(task => {
        const reqIds = taskRequirementsMap.get(task.id);
        if (reqIds && reqIds.length > 0) {
          reqIds.forEach(reqId => {
            const existing = reqMap.get(reqId) || [];
            existing.push(task);
            reqMap.set(reqId, existing);
          });
        } else {
          orphanTasks.push(task);
        }
      });

      requirements.forEach(req => {
        const reqTasks = reqMap.get(req.id) || [];
        if (reqTasks.length > 0) {
          groups.push({
            id: req.id,
            title: `${req.code} - ${req.description}`,
            icon: <Target className="h-4 w-4 text-primary" />,
            tasks: reqTasks,
          });
        }
      });

      if (orphanTasks.length > 0) {
        groups.push({
          id: "no-requirement",
          title: "Sem requisito vinculado",
          icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
          tasks: orphanTasks,
        });
      }
    } else if (groupBy === "milestones") {
      // Group by milestones
      const msMap = new Map<string, ProjectTask[]>();
      const orphanTasks: ProjectTask[] = [];

      tasks.forEach(task => {
        if (task.milestone_id) {
          const existing = msMap.get(task.milestone_id) || [];
          existing.push(task);
          msMap.set(task.milestone_id, existing);
        } else {
          orphanTasks.push(task);
        }
      });

      milestones.forEach(ms => {
        const msTasks = msMap.get(ms.id) || [];
        if (msTasks.length > 0) {
          groups.push({
            id: ms.id,
            title: ms.title,
            icon: <Flag className="h-4 w-4 text-orange-500" />,
            tasks: msTasks,
          });
        }
      });

      if (orphanTasks.length > 0) {
        groups.push({
          id: "no-milestone",
          title: "Sem milestone vinculado",
          icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
          tasks: orphanTasks,
        });
      }
    } else {
      // Group by indicators
      const indMap = new Map<string, ProjectTask[]>();
      const orphanTasks: ProjectTask[] = [];

      tasks.forEach(task => {
        if (task.indicator_id) {
          const existing = indMap.get(task.indicator_id) || [];
          existing.push(task);
          indMap.set(task.indicator_id, existing);
        } else {
          orphanTasks.push(task);
        }
      });

      indicators.forEach(ind => {
        const indTasks = indMap.get(ind.id) || [];
        if (indTasks.length > 0) {
          groups.push({
            id: ind.id,
            title: ind.name,
            icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
            tasks: indTasks,
          });
        }
      });

      if (orphanTasks.length > 0) {
        groups.push({
          id: "no-indicator",
          title: "Sem indicador vinculado",
          icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
          tasks: orphanTasks,
        });
      }
    }

    return groups;
  }, [groupBy, tasks, requirements, milestones, indicators, taskRequirementsMap]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma tarefa cadastrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        value={groupBy}
        onValueChange={(value) => value && setGroupBy(value as typeof groupBy)}
        className="justify-start"
      >
        <ToggleGroupItem value="requirements" size="sm" className="gap-1.5">
          <Target className="h-3.5 w-3.5" />
          Por Requisito
        </ToggleGroupItem>
        <ToggleGroupItem value="milestones" size="sm" className="gap-1.5">
          <Flag className="h-3.5 w-3.5" />
          Por Milestone
        </ToggleGroupItem>
        <ToggleGroupItem value="indicators" size="sm" className="gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Por Indicador
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="space-y-3">
        {groupedTasks.map((group) => (
          <Collapsible key={group.id} defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
              <div className="flex items-center gap-2">
                {group.icon}
                <span className="font-medium text-sm">{group.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {group.tasks.length}
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2 pl-2 border-l-2 border-muted ml-2">
                {group.tasks.map((task) => {
                  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {task.assignee && (
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px]">
                              {task.assignee.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <Badge variant="outline" className={cn("text-xs gap-1", status.className)}>
                          {status.icon}
                          {status.label}
                        </Badge>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
