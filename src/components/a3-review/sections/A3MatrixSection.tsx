import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { A3Task, A3Requirement, A3Indicator, A3Milestone } from "@/hooks/useA3ReviewData";
import { 
  LayoutGrid, 
  Calendar, 
  BarChart3, 
  Target, 
  User, 
  Clock,
  PlaneTakeoff,
  Plane,
  PlaneLanding
} from "lucide-react";
import { format } from "date-fns";

interface A3MatrixSectionProps {
  tasks: A3Task[];
  requirements: A3Requirement[];
  indicators: A3Indicator[];
  milestones: A3Milestone[];
}

interface ActionGroup {
  id: string;
  label: string;
  icon?: React.ReactNode;
  actions: A3Task[];
}

const getMilestoneIcon = (type: string | null) => {
  switch (type) {
    case 'decolagem': return <PlaneTakeoff className="w-4 h-4" />;
    case 'voo': return <Plane className="w-4 h-4" />;
    case 'escala': return <PlaneLanding className="w-4 h-4" />;
    default: return <Calendar className="w-4 h-4" />;
  }
};

const getMilestoneColor = (type: string | null) => {
  switch (type) {
    case 'decolagem': return 'bg-accent/10 border-accent/30 text-accent';
    case 'voo': return 'bg-warning/10 border-warning/30 text-warning';
    case 'escala': return 'bg-success/10 border-success/30 text-success';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function A3MatrixSection({ tasks, requirements, indicators, milestones }: A3MatrixSectionProps) {
  const [groupBy, setGroupBy] = useState<'requirements' | 'milestones' | 'indicators'>('requirements');

  // Create maps for quick lookup
  const milestonesMap = useMemo(() => {
    const map = new Map<string, A3Milestone>();
    milestones.forEach(m => map.set(m.id, m));
    return map;
  }, [milestones]);

  const indicatorsMap = useMemo(() => {
    const map = new Map<string, A3Indicator>();
    indicators.forEach(i => map.set(i.id, i));
    return map;
  }, [indicators]);

  const groupedActions = useMemo((): ActionGroup[] => {
    if (groupBy === 'requirements') {
      const groups: ActionGroup[] = requirements.map(req => ({
        id: req.id,
        label: `${req.code}: ${req.description}`,
        icon: <Target className="w-4 h-4 text-primary" />,
        actions: tasks.filter(t => t.linkedRequirements.includes(req.code))
      }));

      const unlinked = tasks.filter(t => t.linkedRequirements.length === 0);
      if (unlinked.length > 0) {
        groups.push({
          id: 'unlinked',
          label: 'Sem requisito vinculado',
          actions: unlinked
        });
      }
      return groups.filter(g => g.actions.length > 0);
    }

    if (groupBy === 'milestones') {
      const byMilestone = new Map<string, A3Task[]>();
      const noMilestone: A3Task[] = [];

      tasks.forEach(task => {
        if (task.milestoneId) {
          const list = byMilestone.get(task.milestoneId) || [];
          list.push(task);
          byMilestone.set(task.milestoneId, list);
        } else {
          noMilestone.push(task);
        }
      });

      const groups: ActionGroup[] = milestones.map(m => ({
        id: m.id,
        label: m.title,
        icon: getMilestoneIcon(m.milestone_type),
        actions: byMilestone.get(m.id) || []
      }));

      if (noMilestone.length > 0) {
        groups.push({
          id: 'no-milestone',
          label: 'Sem milestone',
          actions: noMilestone
        });
      }
      return groups.filter(g => g.actions.length > 0);
    }

    // Group by indicators
    const byIndicator = new Map<string, A3Task[]>();
    const noIndicator: A3Task[] = [];

    tasks.forEach(task => {
      if (task.linkedIndicatorIds.length > 0) {
        task.linkedIndicatorIds.forEach(indId => {
          const list = byIndicator.get(indId) || [];
          list.push(task);
          byIndicator.set(indId, list);
        });
      } else {
        noIndicator.push(task);
      }
    });

    const groups: ActionGroup[] = indicators.map(ind => ({
      id: ind.id,
      label: ind.name,
      icon: <BarChart3 className="w-4 h-4 text-primary" />,
      actions: byIndicator.get(ind.id) || []
    }));

    if (noIndicator.length > 0) {
      groups.push({
        id: 'no-indicator',
        label: 'Sem indicador',
        actions: noIndicator
      });
    }
    return groups.filter(g => g.actions.length > 0);
  }, [tasks, requirements, indicators, milestones, groupBy]);

  // Stats
  const linkStats = useMemo(() => {
    const withReq = tasks.filter(t => t.linkedRequirements.length > 0).length;
    const withMilestone = tasks.filter(t => t.milestoneId).length;
    const withIndicator = tasks.filter(t => t.linkedIndicatorIds.length > 0).length;
    return {
      total: tasks.length,
      withReq,
      withMilestone,
      withIndicator
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            Nenhuma ação definida para este projeto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Matriz de Ações
          </CardTitle>
          <CardDescription>
            Visualize as ações agrupadas por diferentes critérios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {linkStats.total} ações
            </Badge>
            <Badge 
              variant={linkStats.withReq === linkStats.total ? "default" : "secondary"}
              className="gap-1"
            >
              <Target className="w-3 h-3" />
              {linkStats.withReq}/{linkStats.total} com requisitos
            </Badge>
            <Badge 
              variant={linkStats.withMilestone === linkStats.total ? "default" : "secondary"}
              className="gap-1"
            >
              <Calendar className="w-3 h-3" />
              {linkStats.withMilestone}/{linkStats.total} com milestone
            </Badge>
            <Badge 
              variant={linkStats.withIndicator === linkStats.total ? "default" : "secondary"}
              className="gap-1"
            >
              <BarChart3 className="w-3 h-3" />
              {linkStats.withIndicator}/{linkStats.total} com indicador
            </Badge>
          </div>

          {/* Toggle Group */}
          <ToggleGroup 
            type="single" 
            value={groupBy}
            onValueChange={(v) => v && setGroupBy(v as typeof groupBy)}
            className="justify-start"
          >
            <ToggleGroupItem value="requirements" className="gap-2">
              <Target className="w-4 h-4" />
              Por Requisito
            </ToggleGroupItem>
            <ToggleGroupItem value="milestones" className="gap-2">
              <Calendar className="w-4 h-4" />
              Por Milestone
            </ToggleGroupItem>
            <ToggleGroupItem value="indicators" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Por Indicador
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Grouped Actions */}
          <div className="space-y-4">
            {groupedActions.map((group) => (
              <Card key={group.id} className="border-l-4 border-l-primary">
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    {group.icon}
                    {group.label}
                    <Badge variant="secondary" className="ml-auto">
                      {group.actions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {group.actions.map((task) => {
                    const milestone = task.milestoneId ? milestonesMap.get(task.milestoneId) : null;
                    
                    return (
                      <div 
                        key={task.id}
                        className="p-3 rounded-lg border bg-card/50"
                      >
                        <p className="font-medium text-sm">{task.title}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {task.assigneeName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {task.assigneeName}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(task.dueDate), "dd/MM/yyyy")}
                            </span>
                          )}
                          {milestone && (
                            <Badge 
                              variant="outline" 
                              className={`gap-1 text-xs ${getMilestoneColor(milestone.milestone_type)}`}
                            >
                              {getMilestoneIcon(milestone.milestone_type)}
                              {milestone.milestone_type === 'decolagem' ? 'M1' : 
                               milestone.milestone_type === 'voo' ? 'M2' : 
                               milestone.milestone_type === 'escala' ? 'M3' : 'M'}
                            </Badge>
                          )}
                        </div>
                        {/* Show requirements if not grouping by requirements */}
                        {groupBy !== 'requirements' && task.linkedRequirements.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.linkedRequirements.map(code => (
                              <Badge key={code} variant="secondary" className="text-xs font-mono">
                                {code}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* Show indicators if not grouping by indicators */}
                        {groupBy !== 'indicators' && task.linkedIndicatorIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.linkedIndicatorIds.map(indId => {
                              const ind = indicatorsMap.get(indId);
                              return ind ? (
                                <Badge key={indId} variant="outline" className="text-xs gap-1">
                                  <BarChart3 className="w-3 h-3" />
                                  {ind.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}