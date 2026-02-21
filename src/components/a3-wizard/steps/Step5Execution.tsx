import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { A3WizardData, WizardAction, WizardWhyLink, ActionPriority } from "@/hooks/useA3WizardState";
import { useProjectTeamMembers } from "@/hooks/useTeamMembers";
import { useA3Copilot } from "@/hooks/useA3Copilot";
import { Plus, Trash2, AlertCircle, CheckCircle, Link, ExternalLink, Loader2, ArrowUp, ArrowRight, ArrowDown, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Step5ExecutionProps {
  data: A3WizardData;
  projectId: string | null;
  addAction: () => void;
  updateAction: (id: string, updates: Partial<WizardAction>) => void;
  removeAction: (id: string) => void;
  addWhyLink: () => void;
  updateWhyLink: (id: string, updates: Partial<WizardWhyLink>) => void;
  removeWhyLink: (id: string) => void;
}

const statusOptions = [
  { value: "not_started", label: "Não Iniciada" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "blocked", label: "Bloqueada" },
  { value: "completed", label: "Concluída" },
];

const priorityOptions: { value: ActionPriority; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "high", label: "Alta", icon: <ArrowUp className="w-3 h-3" />, color: "text-destructive" },
  { value: "medium", label: "Padrão", icon: <ArrowRight className="w-3 h-3" />, color: "text-warning" },
  { value: "low", label: "Baixa", icon: <ArrowDown className="w-3 h-3" />, color: "text-muted-foreground" },
];

export function Step5Execution({
  data,
  projectId,
  addAction,
  updateAction,
  removeAction,
  addWhyLink,
  updateWhyLink,
  removeWhyLink
}: Step5ExecutionProps) {
  const { data: teamMembers = [] } = useProjectTeamMembers(projectId);
  const { improveAction } = useA3Copilot();
  const [improvingActionId, setImprovingActionId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'chronology'>('none');

  const toggleRequirementLink = (actionId: string, reqCode: string) => {
    const action = data.actions.find(a => a.id === actionId);
    if (!action) return;
    
    const linked = action.linkedRequirements.includes(reqCode)
      ? action.linkedRequirements.filter(r => r !== reqCode)
      : [...action.linkedRequirements, reqCode];
    updateAction(actionId, { linkedRequirements: linked });
  };

  // Coverage analysis
  const coverage = data.requirements.map(req => {
    const linkedActions = data.actions.filter(a => 
      a.linkedRequirements.includes(req.code) && a.description.trim() !== ""
    );
    return {
      code: req.code,
      description: req.description,
      indicator: req.indicator_name,
      actionCount: linkedActions.length,
      covered: linkedActions.length > 0
    };
  });

  const uncoveredCount = coverage.filter(c => !c.covered).length;

  // Handle AI improve action
  const handleImproveAction = async (actionId: string) => {
    const action = data.actions.find(a => a.id === actionId);
    if (!action || !action.description.trim()) {
      toast.error("Adicione uma descrição primeiro");
      return;
    }

    setImprovingActionId(actionId);
    try {
      const improved = await improveAction(action.description, data);
      if (improved) {
        updateAction(actionId, { description: improved });
        toast.success("Ação melhorada com IA!");
      }
    } catch (error) {
      console.error("Error improving action:", error);
      toast.error("Erro ao melhorar ação");
    } finally {
      setImprovingActionId(null);
    }
  };

  // Sort actions by date if groupBy is chronology
  const sortedActions = groupBy === 'chronology'
    ? [...data.actions].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
    : data.actions;

  const getPriorityBadge = (priority: ActionPriority) => {
    const option = priorityOptions.find(p => p.value === priority);
    if (!option) return null;
    
    return (
      <Badge variant="outline" className={cn("gap-1 text-xs", option.color)}>
        {option.icon}
        {option.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              5
            </span>
            Plano de Ação
          </CardTitle>
          <CardDescription className="mt-2">
            O que vamos fazer? Defina as ações e vincule aos requisitos que serão impactados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary bar */}
          {data.actions.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.actions.length}</span>
                <span className="text-muted-foreground">ações</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={groupBy} onValueChange={(v: 'none' | 'chronology') => setGroupBy(v)}>
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem ordenação</SelectItem>
                    <SelectItem value="chronology">Por Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {priorityOptions.map(p => {
                  const count = data.actions.filter(a => a.priority === p.value).length;
                  if (count === 0) return null;
                  return (
                    <Badge key={p.value} variant="secondary" className={cn("gap-1", p.color)}>
                      {p.icon}
                      {count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {data.actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ação adicionada ainda.</p>
              <p className="text-sm">Adicione ações manualmente ou use a IA para sugestões.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedActions.map((action, index) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-4 bg-card space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Ação {index + 1}
                      </span>
                      {getPriorityBadge(action.priority)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleImproveAction(action.id)}
                        disabled={improvingActionId === action.id}
                        className="text-primary hover:text-primary"
                        title="Melhorar com IA"
                      >
                        {improvingActionId === action.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(action.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição da Ação *</Label>
                    <Textarea
                      value={action.description}
                      onChange={(e) => updateAction(action.id, { description: e.target.value })}
                      placeholder="Descreva a ação a ser executada..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={action.priority}
                        onValueChange={(value: ActionPriority) => updateAction(action.id, { priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className={cn("flex items-center gap-2", option.color)}>
                                {option.icon}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Responsável *</Label>
                      <Select
                        value={action.responsibleId}
                        onValueChange={(value) => updateAction(action.id, { responsibleId: value })}
                      >
                        <SelectTrigger className={cn(
                          action.description.trim() && !action.responsibleId && "border-destructive"
                        )}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {action.description.trim() && !action.responsibleId && (
                        <p className="text-xs text-destructive">Obrigatório</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={action.status}
                        onValueChange={(value) => updateAction(action.id, { status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
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
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={action.startDate}
                        onChange={(e) => updateAction(action.id, { startDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prazo *</Label>
                      <Input
                        type="date"
                        value={action.dueDate}
                        onChange={(e) => updateAction(action.id, { dueDate: e.target.value })}
                        className={cn(
                          action.description.trim() && !action.dueDate && "border-destructive"
                        )}
                      />
                      {action.description.trim() && !action.dueDate && (
                        <p className="text-xs text-destructive">Obrigatório</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Requisitos Impactados *</Label>
                    <div className="flex flex-wrap gap-2">
                      <TooltipProvider>
                        {data.requirements.map((req) => (
                          <Tooltip key={req.code}>
                            <TooltipTrigger asChild>
                              <label
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                                  action.linkedRequirements.includes(req.code)
                                    ? "bg-accent/20 border-accent text-accent"
                                    : "bg-muted/50 border-border hover:bg-muted"
                                )}
                              >
                                <Checkbox
                                  checked={action.linkedRequirements.includes(req.code)}
                                  onCheckedChange={() => toggleRequirementLink(action.id, req.code)}
                                />
                                <span className="text-sm font-medium">{req.code}</span>
                              </label>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="font-medium">{req.code}</p>
                              <p className="text-sm">{req.description || "Sem descrição"}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                    {action.description.trim() !== "" && action.linkedRequirements.length === 0 && (
                      <p className="text-xs text-destructive">
                        Vincule a pelo menos 1 requisito
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={addAction} variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Ação
          </Button>

          {/* Coverage Summary */}
          <div className="bg-muted/30 rounded-lg p-4 border">
            <h4 className="font-medium text-sm mb-3">Cobertura por Requisito</h4>
            <div className="grid gap-2">
              <TooltipProvider>
                {coverage.map((c) => (
                  <Tooltip key={c.code}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg cursor-help",
                          c.covered ? "bg-success/10" : "bg-destructive/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{c.code}</span>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">{c.indicator}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.covered ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-success" />
                              <span className="text-xs text-success">{c.actionCount} ação(ões)</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-destructive" />
                              <span className="text-xs text-destructive">Descoberto!</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium">{c.code}</p>
                      <p className="text-sm">{c.description || "Sem descrição"}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>

            {uncoveredCount > 0 && (
              <p className="text-sm text-destructive mt-3">
                ⚠️ {uncoveredCount} requisito(s) sem ações vinculadas - obrigatório para continuar
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Why Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            Links de Referência
          </CardTitle>
          <CardDescription>
            Adicione links para documentos, artigos ou referências importantes para o projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.whyLinks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <ExternalLink className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum link adicionado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.whyLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 border rounded-lg p-3 bg-card"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      value={link.url}
                      onChange={(e) => updateWhyLink(link.id, { url: e.target.value })}
                      placeholder="https://..."
                      type="url"
                    />
                    <Input
                      value={link.label}
                      onChange={(e) => updateWhyLink(link.id, { label: e.target.value })}
                      placeholder="Descrição do link (opcional)"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWhyLink(link.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={addWhyLink} variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Link
          </Button>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Dica
        </h4>
        <p className="text-sm text-muted-foreground">
          Vincule cada ação aos requisitos que ela impacta. Isso garante rastreabilidade entre o que foi planejado e o que será executado.
        </p>
      </div>
    </div>
  );
}