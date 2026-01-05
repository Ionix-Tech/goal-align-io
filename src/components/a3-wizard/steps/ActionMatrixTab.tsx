import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Target, Calendar, BarChart3, AlertTriangle, CheckCircle2, 
  Settings, PlaneTakeoff, Plane, Rocket, Milestone
} from "lucide-react";
import { A3WizardData, WizardAction } from "@/hooks/useA3WizardState";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ActionLinkPopover } from "./ActionLinkPopover";

interface ActionMatrixTabProps {
  data: A3WizardData;
  updateAction: (id: string, updates: Partial<WizardAction>) => void;
}

type GroupByType = "requirements" | "milestones" | "indicators";

interface ActionGroup {
  id: string;
  label: string;
  icon?: React.ElementType;
  iconColor?: string;
  actions: WizardAction[];
}

export function ActionMatrixTab({ data, updateAction }: ActionMatrixTabProps) {
  const [groupBy, setGroupBy] = useState<GroupByType>("requirements");
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const { data: teamMembers } = useTeamMembers();

  const getResponsibleName = (id: string) => {
    const member = teamMembers?.find(m => m.id === id);
    return member?.full_name || "Não atribuído";
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM", { locale: ptBR });
  };

  // Get milestone info for display
  const getMilestoneInfo = (milestoneKey: string | null) => {
    if (!milestoneKey) return { label: "Sem Milestone", icon: Milestone, color: "text-muted-foreground" };
    
    switch (milestoneKey) {
      case 'm1':
        return { label: `M1 - Decolagem${data.m1Date ? ` (${formatDisplayDate(data.m1Date)})` : ''}`, icon: PlaneTakeoff, color: "text-accent" };
      case 'm2':
        return { label: `M2 - Voo${data.m2Date ? ` (${formatDisplayDate(data.m2Date)})` : ''}`, icon: Plane, color: "text-warning" };
      case 'm3':
        return { label: `M3 - Escala${data.m3Date ? ` (${formatDisplayDate(data.m3Date)})` : ''}`, icon: Rocket, color: "text-success" };
      default:
        // Extra milestone
        const extra = data.extraMilestones.find(m => m.id === milestoneKey);
        return { 
          label: extra?.title || "Milestone Extra", 
          icon: Milestone, 
          color: "text-primary" 
        };
    }
  };

  // Infer milestone from due date
  const inferMilestone = (action: WizardAction): string | null => {
    if (!action.dueDate) return null;
    
    const dueDate = new Date(action.dueDate);
    const m1Date = data.m1Date ? new Date(data.m1Date) : null;
    const m2Date = data.m2Date ? new Date(data.m2Date) : null;
    const m3Date = data.m3Date ? new Date(data.m3Date) : null;
    
    if (m1Date && dueDate <= m1Date) return 'm1';
    if (m2Date && dueDate <= m2Date) return 'm2';
    if (m3Date && dueDate <= m3Date) return 'm3';
    return 'm3'; // Default to M3 if past all dates
  };

  // Infer indicators from linked requirements
  const inferIndicators = (action: WizardAction): string[] => {
    const indicatorIds: string[] = [];
    
    for (const ind of data.indicators) {
      const hasOverlap = ind.linkedRequirementCodes.some(code => 
        action.linkedRequirements.includes(code)
      );
      if (hasOverlap) {
        indicatorIds.push(ind.id);
      }
    }
    
    return indicatorIds;
  };

  // Get effective milestone (manual or inferred)
  const getEffectiveMilestone = (action: WizardAction) => {
    return action.linkedMilestone ?? inferMilestone(action);
  };

  // Get effective indicators (manual or inferred)
  const getEffectiveIndicators = (action: WizardAction) => {
    return action.linkedIndicators.length > 0 
      ? action.linkedIndicators 
      : inferIndicators(action);
  };

  // Group actions based on selected grouping
  const groupedActions = useMemo<ActionGroup[]>(() => {
    const validActions = data.actions.filter(a => a.description.trim() !== "");
    
    switch (groupBy) {
      case "requirements": {
        const groups: ActionGroup[] = data.requirements
          .filter(r => r.description.trim() !== "")
          .map(req => ({
            id: req.code,
            label: `${req.code} - ${req.description.substring(0, 50)}${req.description.length > 50 ? '...' : ''}`,
            actions: validActions.filter(a => a.linkedRequirements.includes(req.code))
          }));
        
        // Add "unlinked" group
        const unlinked = validActions.filter(a => a.linkedRequirements.length === 0);
        if (unlinked.length > 0) {
          groups.push({
            id: "unlinked",
            label: "⚠️ Sem Requisito",
            actions: unlinked
          });
        }
        
        return groups.filter(g => g.actions.length > 0);
      }
      
      case "milestones": {
        const milestoneGroups = [
          { id: 'm1', label: `M1 - Decolagem${data.m1Date ? ` (${formatDisplayDate(data.m1Date)})` : ''}`, icon: PlaneTakeoff, iconColor: "text-accent" },
          { id: 'm2', label: `M2 - Voo${data.m2Date ? ` (${formatDisplayDate(data.m2Date)})` : ''}`, icon: Plane, iconColor: "text-warning" },
          { id: 'm3', label: `M3 - Escala${data.m3Date ? ` (${formatDisplayDate(data.m3Date)})` : ''}`, icon: Rocket, iconColor: "text-success" },
        ];
        
        // Add extra milestones
        data.extraMilestones.forEach(m => {
          if (m.title.trim()) {
            milestoneGroups.push({
              id: m.id,
              label: `${m.title}${m.targetDate ? ` (${formatDisplayDate(m.targetDate)})` : ''}`,
              icon: Milestone,
              iconColor: "text-primary"
            });
          }
        });
        
        const groups: ActionGroup[] = milestoneGroups.map(ms => ({
          ...ms,
          actions: validActions.filter(a => getEffectiveMilestone(a) === ms.id)
        }));
        
        // Add "no milestone" group
        const noMilestone = validActions.filter(a => !getEffectiveMilestone(a));
        if (noMilestone.length > 0) {
          groups.push({
            id: "no-milestone",
            label: "⚠️ Sem Milestone",
            icon: AlertTriangle,
            iconColor: "text-destructive",
            actions: noMilestone
          });
        }
        
        return groups.filter(g => g.actions.length > 0);
      }
      
      case "indicators": {
        const groups: ActionGroup[] = data.indicators.map(ind => ({
          id: ind.id,
          label: `${ind.name}${ind.unit ? ` (${ind.unit})` : ''}`,
          icon: BarChart3,
          iconColor: "text-primary",
          actions: validActions.filter(a => getEffectiveIndicators(a).includes(ind.id))
        }));
        
        // Add "no indicator" group
        const noIndicator = validActions.filter(a => getEffectiveIndicators(a).length === 0);
        if (noIndicator.length > 0) {
          groups.push({
            id: "no-indicator",
            label: "⚠️ Sem Indicador",
            icon: AlertTriangle,
            iconColor: "text-destructive",
            actions: noIndicator
          });
        }
        
        return groups.filter(g => g.actions.length > 0);
      }
    }
  }, [data, groupBy]);

  // Count actions with complete links
  const linkStats = useMemo(() => {
    const validActions = data.actions.filter(a => a.description.trim() !== "");
    const withReqs = validActions.filter(a => a.linkedRequirements.length > 0).length;
    const withMilestone = validActions.filter(a => getEffectiveMilestone(a)).length;
    const withIndicators = validActions.filter(a => getEffectiveIndicators(a).length > 0).length;
    
    return {
      total: validActions.length,
      withReqs,
      withMilestone,
      withIndicators,
      complete: validActions.filter(a => 
        a.linkedRequirements.length > 0 && 
        getEffectiveMilestone(a) && 
        getEffectiveIndicators(a).length > 0
      ).length
    };
  }, [data]);

  const validActions = data.actions.filter(a => a.description.trim() !== "");

  if (validActions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma ação definida. Volte ao Step 5 para criar ações.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Badge variant="outline" className="gap-1">
          <Target className="w-3 h-3" />
          {linkStats.withReqs}/{linkStats.total} com requisitos
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Calendar className="w-3 h-3" />
          {linkStats.withMilestone}/{linkStats.total} com milestones
        </Badge>
        <Badge variant="outline" className="gap-1">
          <BarChart3 className="w-3 h-3" />
          {linkStats.withIndicators}/{linkStats.total} com indicadores
        </Badge>
        {linkStats.complete === linkStats.total ? (
          <Badge variant="default" className="gap-1 bg-success">
            <CheckCircle2 className="w-3 h-3" />
            Todas completas
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            {linkStats.complete}/{linkStats.total} completas
          </Badge>
        )}
      </div>

      {/* Group By Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Agrupar por:</span>
        <ToggleGroup 
          type="single" 
          value={groupBy} 
          onValueChange={(val) => val && setGroupBy(val as GroupByType)}
          className="justify-start"
        >
          <ToggleGroupItem value="requirements" className="gap-1.5 text-xs">
            <Target className="w-3.5 h-3.5" />
            Requisitos
          </ToggleGroupItem>
          <ToggleGroupItem value="milestones" className="gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            Milestones
          </ToggleGroupItem>
          <ToggleGroupItem value="indicators" className="gap-1.5 text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            Indicadores
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Grouped Actions */}
      <div className="space-y-3">
        {groupedActions.map(group => {
          const GroupIcon = group.icon;
          const isWarningGroup = group.id.includes("unlinked") || group.id.includes("no-");
          
          return (
            <Card key={group.id} className={cn(
              "overflow-hidden",
              isWarningGroup && "border-warning/50 bg-warning/5"
            )}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {GroupIcon && (
                    <GroupIcon className={cn("w-4 h-4", group.iconColor)} />
                  )}
                  {group.label}
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {group.actions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 px-4 pb-3">
                <div className="space-y-2">
                  {group.actions.map(action => {
                    const effectiveMilestone = getEffectiveMilestone(action);
                    const effectiveIndicators = getEffectiveIndicators(action);
                    const isInferred = (
                      (action.linkedMilestone === null && effectiveMilestone !== null) ||
                      (action.linkedIndicators.length === 0 && effectiveIndicators.length > 0)
                    );
                    
                    return (
                      <div 
                        key={action.id} 
                        className="flex items-center justify-between gap-2 text-sm p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{action.description}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            <span>👤 {getResponsibleName(action.responsibleId)}</span>
                            {action.dueDate && <span>📅 {formatDisplayDate(action.dueDate)}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Show linked requirements badges */}
                          {groupBy !== "requirements" && action.linkedRequirements.length > 0 && (
                            <div className="hidden sm:flex gap-1">
                              {action.linkedRequirements.slice(0, 2).map(code => (
                                <Badge key={code} variant="outline" className="text-[10px] px-1.5">
                                  {code}
                                </Badge>
                              ))}
                              {action.linkedRequirements.length > 2 && (
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  +{action.linkedRequirements.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Inferred indicator */}
                          {isInferred && (
                            <span className="text-[10px] text-muted-foreground italic hidden sm:block">
                              inferido
                            </span>
                          )}
                          
                          {/* Edit button with popover */}
                          <ActionLinkPopover
                            action={action}
                            data={data}
                            updateAction={updateAction}
                            inferredMilestone={inferMilestone(action)}
                            inferredIndicators={inferIndicators(action)}
                          >
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                          </ActionLinkPopover>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help text */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        💡 Clique no ícone <Settings className="w-3 h-3 inline" /> para ajustar os vínculos de cada ação. 
        Vínculos marcados como "inferido" são calculados automaticamente com base na data e requisitos.
      </div>
    </div>
  );
}
