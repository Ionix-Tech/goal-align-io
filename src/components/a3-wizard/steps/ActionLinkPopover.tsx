import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Target, Calendar, BarChart3, PlaneTakeoff, Plane, Rocket, 
  Milestone, Sparkles, Save
} from "lucide-react";
import { A3WizardData, WizardAction } from "@/hooks/useA3WizardState";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActionLinkPopoverProps {
  action: WizardAction;
  data: A3WizardData;
  updateAction: (id: string, updates: Partial<WizardAction>) => void;
  inferredMilestone: string | null;
  inferredIndicators: string[];
  children: React.ReactNode;
}

export function ActionLinkPopover({
  action,
  data,
  updateAction,
  inferredMilestone,
  inferredIndicators,
  children
}: ActionLinkPopoverProps) {
  const [open, setOpen] = useState(false);
  const [localRequirements, setLocalRequirements] = useState<string[]>(action.linkedRequirements);
  const [localMilestone, setLocalMilestone] = useState<string | null>(action.linkedMilestone);
  const [localIndicators, setLocalIndicators] = useState<string[]>(action.linkedIndicators);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      // Reset to current values when opening
      setLocalRequirements(action.linkedRequirements);
      setLocalMilestone(action.linkedMilestone);
      setLocalIndicators(action.linkedIndicators);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    updateAction(action.id, {
      linkedRequirements: localRequirements,
      linkedMilestone: localMilestone,
      linkedIndicators: localIndicators
    });
    setOpen(false);
  };

  const toggleRequirement = (code: string) => {
    setLocalRequirements(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleIndicator = (id: string) => {
    setLocalIndicators(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "dd/MM", { locale: ptBR });
  };

  const getMilestoneOptions = () => {
    const options = [
      { 
        id: 'm1', 
        label: 'M1 - Decolagem', 
        date: data.m1Date,
        icon: PlaneTakeoff,
        color: 'text-accent'
      },
      { 
        id: 'm2', 
        label: 'M2 - Voo', 
        date: data.m2Date,
        icon: Plane,
        color: 'text-warning'
      },
      { 
        id: 'm3', 
        label: 'M3 - Escala', 
        date: data.m3Date,
        icon: Rocket,
        color: 'text-success'
      },
    ];

    // Add extra milestones
    data.extraMilestones.forEach(m => {
      if (m.title.trim()) {
        options.push({
          id: m.id,
          label: m.title,
          date: m.targetDate,
          icon: Milestone,
          color: 'text-primary'
        });
      }
    });

    return options;
  };

  const effectiveMilestone = localMilestone ?? inferredMilestone;
  const effectiveIndicators = localIndicators.length > 0 ? localIndicators : inferredIndicators;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">Vínculos da Ação</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {action.description}
            </p>
          </div>

          <Separator />

          {/* Requirements */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <Target className="w-3.5 h-3.5" />
              Requisitos
            </Label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {data.requirements.filter(r => r.description.trim()).map(req => (
                <label 
                  key={req.code}
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-muted/50",
                    localRequirements.includes(req.code) && "bg-primary/10"
                  )}
                >
                  <Checkbox
                    checked={localRequirements.includes(req.code)}
                    onCheckedChange={() => toggleRequirement(req.code)}
                  />
                  <Badge variant="outline" className="shrink-0 text-[10px]">{req.code}</Badge>
                  <span className="truncate">{req.description}</span>
                </label>
              ))}
              {data.requirements.filter(r => r.description.trim()).length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Nenhum requisito definido</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Milestone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              Milestone Alvo
            </Label>
            <RadioGroup 
              value={localMilestone || ""} 
              onValueChange={(val) => setLocalMilestone(val || null)}
              className="space-y-1"
            >
              {getMilestoneOptions().map(ms => {
                const MsIcon = ms.icon;
                const isInferred = localMilestone === null && inferredMilestone === ms.id;
                
                return (
                  <label 
                    key={ms.id}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-muted/50",
                      (localMilestone === ms.id || isInferred) && "bg-primary/10"
                    )}
                  >
                    <RadioGroupItem value={ms.id} />
                    <MsIcon className={cn("w-3.5 h-3.5", ms.color)} />
                    <span className="flex-1">{ms.label}</span>
                    {ms.date && (
                      <span className="text-muted-foreground">{formatDisplayDate(ms.date)}</span>
                    )}
                    {isInferred && (
                      <span title="Inferido automaticamente">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </span>
                    )}
                  </label>
                );
              })}
              <label 
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-muted/50",
                  localMilestone === null && inferredMilestone === null && "bg-muted/50"
                )}
              >
                <RadioGroupItem value="" />
                <span className="text-muted-foreground">Nenhum / Usar inferência</span>
              </label>
            </RadioGroup>
            {inferredMilestone && localMilestone === null && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Inferido automaticamente baseado na data de conclusão
              </p>
            )}
          </div>

          <Separator />

          {/* Indicators */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <BarChart3 className="w-3.5 h-3.5" />
              Indicadores Impactados
            </Label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {data.indicators.map(ind => {
                const isInferred = localIndicators.length === 0 && inferredIndicators.includes(ind.id);
                const isChecked = localIndicators.includes(ind.id) || isInferred;
                
                return (
                  <label 
                    key={ind.id}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-muted/50",
                      isChecked && "bg-primary/10"
                    )}
                  >
                    <Checkbox
                      checked={localIndicators.includes(ind.id)}
                      onCheckedChange={() => toggleIndicator(ind.id)}
                    />
                    <span className="flex-1 truncate">{ind.name}</span>
                    {ind.unit && (
                      <span className="text-muted-foreground shrink-0">({ind.unit})</span>
                    )}
                    {isInferred && (
                      <span title="Inferido via requisitos">
                        <Sparkles className="w-3 h-3 text-primary shrink-0" />
                      </span>
                    )}
                  </label>
                );
              })}
              {data.indicators.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Nenhum indicador definido</p>
              )}
            </div>
            {inferredIndicators.length > 0 && localIndicators.length === 0 && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Inferidos via requisitos vinculados
              </p>
            )}
          </div>
        </div>

        <div className="border-t p-3 bg-muted/30">
          <Button onClick={handleSave} size="sm" className="w-full gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Salvar Vínculos
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
