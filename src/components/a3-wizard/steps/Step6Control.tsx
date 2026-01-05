import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { A3WizardData, WizardIndicator, WizardMilestone } from "@/hooks/useA3WizardState";
import { Plane, PlaneTakeoff, PlaneLanding, Calendar, FileText, Send, BarChart3, Plus, Trash2, Target, Crosshair } from "lucide-react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { WizardIndicatorManager } from "./WizardIndicatorManager";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useThesisDetails } from "@/hooks/useThesisDetails";

interface Step6ControlProps {
  data: A3WizardData;
  updateData: (updates: Partial<A3WizardData>) => void;
  setIndicators: (indicators: WizardIndicator[]) => void;
  addExtraMilestone: () => void;
  updateExtraMilestone: (id: string, updates: Partial<WizardMilestone>) => void;
  removeExtraMilestone: (id: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const checklistItems = [
  { id: "context", label: "Contexto e objetivo claramente definidos" },
  { id: "requirements", label: "Requisitos do projeto estão descritos" },
  { id: "indicators", label: "Indicadores definidos e correlacionados aos requisitos" },
  { id: "diagnosis", label: "Situação atual documentada com evidências" },
  { id: "targets", label: "Metas são desafiadoras mas alcançáveis em 90 dias" },
  { id: "actions", label: "Ações planejadas com responsáveis e prazos" },
];

export function Step6Control({ 
  data, 
  updateData, 
  setIndicators, 
  addExtraMilestone,
  updateExtraMilestone,
  removeExtraMilestone,
  onSubmit, 
  isSubmitting 
}: Step6ControlProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const { data: thesisDetails } = useThesisDetails(data.thesisId || undefined);

  // Calculate suggested dates for M2 and M3 based on M1
  const suggestedDates = useMemo(() => {
    if (!data.m1Date) return { m2: "", m3: "" };
    
    const m1 = new Date(data.m1Date);
    const m2 = addDays(m1, 45);
    const m3 = addDays(m1, 90);
    
    return {
      m2: format(m2, "yyyy-MM-dd"),
      m3: format(m3, "yyyy-MM-dd")
    };
  }, [data.m1Date]);

  // Update M2 and M3 automatically when M1 changes (only if they're empty or auto-generated)
  const handleM1Change = (date: string) => {
    if (date) {
      const m1 = new Date(date);
      const newM2 = format(addDays(m1, 45), "yyyy-MM-dd");
      const newM3 = format(addDays(m1, 90), "yyyy-MM-dd");
      
      // Only auto-fill if M2/M3 are empty or match the old calculated values
      const updates: Partial<A3WizardData> = { m1Date: date };
      
      if (!data.m2Date || data.m2Date === suggestedDates.m2) {
        updates.m2Date = newM2;
      }
      if (!data.m3Date || data.m3Date === suggestedDates.m3) {
        updates.m3Date = newM3;
      }
      
      updateData(updates);
    } else {
      updateData({ m1Date: date });
    }
  };

  const toggleChecklistItem = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const checklistComplete = checkedItems.length === checklistItems.length;
  const canSubmit = data.m1Date && checklistComplete;

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd 'de' MMMM", { locale: ptBR });
  };

  // Map requirements for the indicator manager
  const requirementOptions = data.requirements.map(r => ({
    code: r.code,
    description: r.description
  }));

  return (
    <div className="space-y-6">
      {/* Objetivo Estratégico */}
      {(data.thesisId || data.strategicKpis.length > 0) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crosshair className="w-5 h-5 text-primary" />
              Objetivo Estratégico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Objetivo (Tese) */}
            {thesisDetails && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Objetivo</Label>
                <p className="font-medium">{thesisDetails.name}</p>
                {thesisDetails.objective && (
                  <p className="text-sm text-muted-foreground">{thesisDetails.objective}</p>
                )}
              </div>
            )}

            {/* KPIs Estratégicos Selecionados */}
            {data.strategicKpis.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Indicadores Estratégicos (KRs) Impactados
                </Label>
                <div className="flex flex-wrap gap-2">
                  {data.strategicKpis.map((kpi) => {
                    const kpiDetails = thesisDetails?.kpis?.find(k => k.id === kpi.kpiId);
                    return (
                      <Badge key={kpi.kpiId} variant="secondary" className="gap-1">
                        {kpi.kpiName}
                        {kpiDetails?.unit && (
                          <span className="text-muted-foreground">({kpiDetails.unit})</span>
                        )}
                        {kpiDetails?.target_value != null && (
                          <span className="text-muted-foreground">
                            → Meta: {kpiDetails.target_value}
                          </span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mensagem se não houver KPIs mas tiver tese */}
            {data.thesisId && data.strategicKpis.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Nenhum indicador estratégico selecionado. Volte ao passo 1 para vincular.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Como vamos medir? */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Como vamos medir?
          </CardTitle>
          <CardDescription>
            Defina os indicadores que medirão o sucesso do projeto e correlacione-os aos requisitos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WizardIndicatorManager
            indicators={data.indicators}
            onIndicatorsChange={setIndicators}
            requirements={requirementOptions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              6
            </span>
            Controle
          </CardTitle>
          <CardDescription>
            Quando vamos verificar? Configure os milestones e valide o projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Milestones */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Milestones do Projeto (90 dias)
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* M1 - Decolagem */}
              <div className="border rounded-lg p-4 bg-card space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <PlaneTakeoff className="w-5 h-5" />
                  <span className="font-semibold">M1 - Decolagem</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Apresentação inicial e alinhamento
                </p>
                <Input
                  type="date"
                  value={data.m1Date}
                  onChange={(e) => handleM1Change(e.target.value)}
                  className="w-full"
                />
                {data.m1Date && (
                  <p className="text-sm text-center font-medium">
                    {formatDisplayDate(data.m1Date)}
                  </p>
                )}
              </div>

              {/* M2 - Voo */}
              <TooltipProvider>
                <div className="border rounded-lg p-4 bg-card space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <Plane className="w-5 h-5" />
                    <span className="font-semibold">M2 - Voo</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground cursor-help">
                        Checkpoint intermediário (sugestão: +45 dias)
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A data é calculada automaticamente como M1 + 45 dias, mas você pode ajustar manualmente</p>
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    type="date"
                    value={data.m2Date}
                    onChange={(e) => updateData({ m2Date: e.target.value })}
                    className="w-full"
                  />
                  {data.m2Date && (
                    <p className="text-sm text-center font-medium">
                      {formatDisplayDate(data.m2Date)}
                    </p>
                  )}
                </div>
              </TooltipProvider>

              {/* M3 - Escala */}
              <TooltipProvider>
                <div className="border rounded-lg p-4 bg-card space-y-3">
                  <div className="flex items-center gap-2 text-success">
                    <PlaneLanding className="w-5 h-5" />
                    <span className="font-semibold">M3 - Escala</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground cursor-help">
                        Finalização e resultados (sugestão: +90 dias)
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A data é calculada automaticamente como M1 + 90 dias, mas você pode ajustar manualmente</p>
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    type="date"
                    value={data.m3Date}
                    onChange={(e) => updateData({ m3Date: e.target.value })}
                    className="w-full"
                  />
                  {data.m3Date && (
                    <p className="text-sm text-center font-medium">
                      {formatDisplayDate(data.m3Date)}
                    </p>
                  )}
                </div>
              </TooltipProvider>
            </div>

            {/* Extra Milestones */}
            <div className="mt-6 space-y-4">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Milestones Adicionais (opcional)
              </Label>
              
              {data.extraMilestones.length > 0 && (
                <div className="space-y-3">
                  {data.extraMilestones.map((milestone, index) => (
                    <div 
                      key={milestone.id} 
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          placeholder={`Milestone ${index + 1}`}
                          value={milestone.title}
                          onChange={(e) => updateExtraMilestone(milestone.id, { title: e.target.value })}
                        />
                        <Input
                          placeholder="Descrição (opcional)"
                          value={milestone.description}
                          onChange={(e) => updateExtraMilestone(milestone.id, { description: e.target.value })}
                        />
                        <Input
                          type="date"
                          value={milestone.targetDate}
                          onChange={(e) => updateExtraMilestone(milestone.id, { targetDate: e.target.value })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExtraMilestone(milestone.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExtraMilestone}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Milestone
              </Button>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Checklist de Qualidade
            </Label>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              {checklistItems.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                    checkedItems.includes(item.id) 
                      ? "bg-success/10" 
                      : "hover:bg-muted"
                  )}
                >
                  <Checkbox
                    checked={checkedItems.includes(item.id)}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                  />
                  <span className={cn(
                    "text-sm",
                    checkedItems.includes(item.id) && "line-through text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {checkedItems.length} de {checklistItems.length} itens verificados
            </p>
          </div>

          {/* A3 Preview Summary */}
          <div className="border rounded-lg p-4 bg-primary/5">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resumo do A3
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Projeto:</span>
                <p className="font-medium truncate">{data.name || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Requisitos:</span>
                <p className="font-medium">{data.requirements.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Indicadores:</span>
                <p className="font-medium">{data.indicators.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ações:</span>
                <p className="font-medium">{data.actions.length}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full gap-2"
            size="lg"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Enviando..." : "Enviar para Aprovação"}
          </Button>

          {!canSubmit && (
            <p className="text-sm text-center text-muted-foreground">
              Complete o checklist e defina a data de início (M1) para enviar.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Próximos Passos
        </h4>
        <p className="text-sm text-muted-foreground">
          Após enviar para aprovação, o projeto será revisado. Se aprovado, você poderá iniciar a execução e acompanhar o progresso nos milestones M1, M2 e M3.
        </p>
      </div>
    </div>
  );
}
