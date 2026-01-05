import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { A3WizardData, StrategicKPI } from "@/hooks/useA3WizardState";
import { 
  FileText, Target, Search, Lightbulb, ClipboardList, Shield, Send, 
  Pencil, Calendar, BarChart3, Crosshair, Link, PlaneTakeoff, Plane, Rocket,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useThesisDetails } from "@/hooks/useThesisDetails";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Step7ReviewProps {
  data: A3WizardData;
  goToStep: (step: number) => void;
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

export function Step7Review({ 
  data, 
  goToStep, 
  onSubmit, 
  isSubmitting 
}: Step7ReviewProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([
    "context", "okr", "requirements", "current", "target", "actions", "indicators", "milestones"
  ]);
  
  const { data: thesisDetails } = useThesisDetails(data.thesisId || undefined);
  const { data: teamMembers } = useTeamMembers();

  const toggleChecklistItem = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const checklistComplete = checkedItems.length === checklistItems.length;
  const canSubmit = data.m1Date && checklistComplete;

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getResponsibleName = (id: string) => {
    const member = teamMembers?.find(m => m.id === id);
    return member?.full_name || "Não definido";
  };

  // Validation helpers
  const hasContext = data.name.trim() !== "" && data.objective.trim() !== "";
  const hasRequirements = data.requirements.filter(r => r.description.trim() !== "").length > 0;
  const hasCurrentSituation = data.currentSituationDescription.trim() !== "";
  const hasTargetSituation = data.targetSituationDescription.trim() !== "";
  const hasActions = data.actions.filter(a => a.description.trim() !== "").length > 0;
  const hasIndicators = data.indicators.length > 0;
  const hasMilestones = data.m1Date !== "";

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    step, 
    isOpen, 
    onToggle, 
    badge,
    isComplete 
  }: { 
    title: string; 
    icon: React.ElementType; 
    step: number; 
    isOpen: boolean; 
    onToggle: () => void;
    badge?: string;
    isComplete: boolean;
  }) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Icon className="w-5 h-5" />
          <span className="font-semibold">{title}</span>
        </button>
        {badge && (
          <Badge variant="secondary" className="ml-2">{badge}</Badge>
        )}
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-success ml-1" />
        ) : (
          <AlertCircle className="w-4 h-4 text-destructive ml-1" />
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goToStep(step)}
        className="gap-1 text-muted-foreground hover:text-foreground"
      >
        <Pencil className="w-3 h-3" />
        Editar Step {step}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              7
            </span>
            Revisão Final do A3
          </CardTitle>
          <CardDescription>
            Revise todos os itens do projeto antes de enviar para aprovação. Clique em "Editar" para voltar a qualquer etapa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Section 1: Contexto */}
          <Collapsible open={openSections.includes("context")} onOpenChange={() => toggleSection("context")}>
            <div className="border rounded-lg p-4 bg-card">
              <CollapsibleTrigger asChild>
                <SectionHeader 
                  title="Contexto" 
                  icon={FileText} 
                  step={1} 
                  isOpen={openSections.includes("context")}
                  onToggle={() => toggleSection("context")}
                  isComplete={hasContext}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome do Projeto:</span>
                    <p className="font-medium">{data.name || <span className="text-destructive">Não definido</span>}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <p className="font-medium">{data.category || "-"}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Objetivo:</span>
                  <p className="font-medium">{data.objective || <span className="text-destructive">Não definido</span>}</p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Section 2: OKR (Objetivo Estratégico) */}
          {(data.thesisId || data.strategicKpis.length > 0) && (
            <Collapsible open={openSections.includes("okr")} onOpenChange={() => toggleSection("okr")}>
              <div className="border rounded-lg p-4 bg-primary/5 border-primary/30">
                <CollapsibleTrigger asChild>
                  <SectionHeader 
                    title="Objetivo Estratégico (OKR)" 
                    icon={Crosshair} 
                    step={1} 
                    isOpen={openSections.includes("okr")}
                    onToggle={() => toggleSection("okr")}
                    badge={data.strategicKpis.length > 0 ? `${data.strategicKpis.length} KRs` : undefined}
                    isComplete={!!data.thesisId || data.strategicKpis.length > 0}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-3">
                  {thesisDetails && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Tese:</span>
                      <p className="font-medium">{thesisDetails.name}</p>
                      {thesisDetails.objective && (
                        <p className="text-muted-foreground text-xs mt-1">{thesisDetails.objective}</p>
                      )}
                    </div>
                  )}
                  {data.strategicKpis.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">KRs Impactados:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.strategicKpis.map((kpi) => {
                          const kpiDetails = thesisDetails?.kpis?.find(k => k.id === kpi.kpiId);
                          return (
                            <Badge key={kpi.kpiId} variant="secondary">
                              {kpi.kpiName}
                              {kpiDetails?.target_value != null && (
                                <span className="text-muted-foreground ml-1">→ Meta: {kpiDetails.target_value}{kpiDetails.unit}</span>
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Section 3: Requisitos */}
          <Collapsible open={openSections.includes("requirements")} onOpenChange={() => toggleSection("requirements")}>
            <div className="border rounded-lg p-4 bg-card">
              <CollapsibleTrigger asChild>
                <SectionHeader 
                  title="Requisitos" 
                  icon={Target} 
                  step={2} 
                  isOpen={openSections.includes("requirements")}
                  onToggle={() => toggleSection("requirements")}
                  badge={`${data.requirements.filter(r => r.description.trim()).length}`}
                  isComplete={hasRequirements}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {data.requirements.filter(r => r.description.trim()).length > 0 ? (
                  <div className="space-y-2">
                    {data.requirements.filter(r => r.description.trim()).map((req) => (
                      <div key={req.code} className="flex items-start gap-2 text-sm p-2 bg-muted/30 rounded">
                        <Badge variant="outline" className="shrink-0">{req.code}</Badge>
                        <span>{req.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-destructive">Nenhum requisito definido</p>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Section 4: Situação Atual */}
          <Collapsible open={openSections.includes("current")} onOpenChange={() => toggleSection("current")}>
            <div className="border rounded-lg p-4 bg-card">
              <CollapsibleTrigger asChild>
                <SectionHeader 
                  title="Situação Atual" 
                  icon={Search} 
                  step={3} 
                  isOpen={openSections.includes("current")}
                  onToggle={() => toggleSection("current")}
                  isComplete={hasCurrentSituation}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <p className="text-sm">
                  {data.currentSituationDescription || <span className="text-destructive">Não definido</span>}
                </p>
                {data.whyLinks.filter(l => l.url.trim()).length > 0 && (
                  <div className="mt-3 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      Links de evidência:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {data.whyLinks.filter(l => l.url.trim()).map((link) => (
                        <a 
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {link.label || link.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Section 5: Situação Alvo */}
          <Collapsible open={openSections.includes("target")} onOpenChange={() => toggleSection("target")}>
            <div className="border rounded-lg p-4 bg-card">
              <CollapsibleTrigger asChild>
                <SectionHeader 
                  title="Situação Alvo" 
                  icon={Lightbulb} 
                  step={4} 
                  isOpen={openSections.includes("target")}
                  onToggle={() => toggleSection("target")}
                  isComplete={hasTargetSituation}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <p className="text-sm">
                  {data.targetSituationDescription || <span className="text-destructive">Não definido</span>}
                </p>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Section 6: Plano de Ação */}
          <Collapsible open={openSections.includes("actions")} onOpenChange={() => toggleSection("actions")}>
            <div className="border rounded-lg p-4 bg-card">
              <CollapsibleTrigger asChild>
                <SectionHeader 
                  title="Plano de Ação" 
                  icon={ClipboardList} 
                  step={5} 
                  isOpen={openSections.includes("actions")}
                  onToggle={() => toggleSection("actions")}
                  badge={`${data.actions.filter(a => a.description.trim()).length} ações`}
                  isComplete={hasActions}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {data.actions.filter(a => a.description.trim()).length > 0 ? (
                  <div className="space-y-2">
                    {data.actions.filter(a => a.description.trim()).map((action, index) => (
                      <div key={action.id} className="flex items-start justify-between gap-2 text-sm p-2 bg-muted/30 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{action.description}</span>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            <span>👤 {getResponsibleName(action.responsibleId)}</span>
                            {action.dueDate && <span>📅 até {formatDisplayDate(action.dueDate)}</span>}
                          </div>
                        </div>
                        {action.linkedRequirements.length > 0 && (
                          <div className="flex gap-1">
                            {action.linkedRequirements.map(code => (
                              <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-destructive">Nenhuma ação definida</p>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Section 7: Indicadores do Projeto */}
          <Collapsible open={openSections.includes("indicators")} onOpenChange={() => toggleSection("indicators")}>
            <div className="border rounded-lg p-4 bg-card">
              <CollapsibleTrigger asChild>
                <SectionHeader 
                  title="Indicadores do Projeto" 
                  icon={BarChart3} 
                  step={6} 
                  isOpen={openSections.includes("indicators")}
                  onToggle={() => toggleSection("indicators")}
                  badge={`${data.indicators.length}`}
                  isComplete={hasIndicators}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {data.indicators.length > 0 ? (
                  <div className="space-y-2">
                    {data.indicators.map((indicator) => (
                      <div key={indicator.id} className="flex items-start justify-between gap-2 text-sm p-2 bg-muted/30 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{indicator.name}</span>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Atual: {indicator.currentValue}{indicator.unit && ` ${indicator.unit}`}</span>
                            <span>→</span>
                            <span>Meta: {indicator.targetValue}{indicator.unit && ` ${indicator.unit}`}</span>
                          </div>
                        </div>
                        {indicator.linkedRequirementCodes.length > 0 && (
                          <div className="flex gap-1">
                            {indicator.linkedRequirementCodes.map(code => (
                              <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-destructive">Nenhum indicador definido</p>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Section 8: Milestones */}
          <Collapsible open={openSections.includes("milestones")} onOpenChange={() => toggleSection("milestones")}>
            <div className="border rounded-lg p-4 bg-card">
              <CollapsibleTrigger asChild>
                <SectionHeader 
                  title="Milestones" 
                  icon={Calendar} 
                  step={6} 
                  isOpen={openSections.includes("milestones")}
                  onToggle={() => toggleSection("milestones")}
                  isComplete={hasMilestones}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <PlaneTakeoff className="w-4 h-4 text-accent" />
                    <div>
                      <span className="text-xs text-muted-foreground">M1 - Decolagem</span>
                      <p className="font-medium">
                        {data.m1Date ? formatDisplayDate(data.m1Date) : <span className="text-destructive">Não definido</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Plane className="w-4 h-4 text-warning" />
                    <div>
                      <span className="text-xs text-muted-foreground">M2 - Voo</span>
                      <p className="font-medium">
                        {data.m2Date ? formatDisplayDate(data.m2Date) : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Rocket className="w-4 h-4 text-success" />
                    <div>
                      <span className="text-xs text-muted-foreground">M3 - Escala</span>
                      <p className="font-medium">
                        {data.m3Date ? formatDisplayDate(data.m3Date) : "-"}
                      </p>
                    </div>
                  </div>
                </div>
                {data.extraMilestones.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <span className="text-xs text-muted-foreground">Milestones adicionais:</span>
                    {data.extraMilestones.filter(m => m.title.trim()).map(m => (
                      <div key={m.id} className="text-sm p-2 bg-muted/30 rounded flex justify-between">
                        <span>{m.title}</span>
                        <span className="text-muted-foreground">{m.targetDate ? formatDisplayDate(m.targetDate) : "-"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Checklist de Qualidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Checklist de Qualidade
          </CardTitle>
          <CardDescription>
            Confirme que todos os itens estão completos antes de enviar para aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              {!data.m1Date 
                ? "Defina a data de início (M1) no Step 6 para enviar."
                : "Complete o checklist acima para enviar."}
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
