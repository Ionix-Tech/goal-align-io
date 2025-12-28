import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LocalAction {
  id: string;
  description: string;
  responsibleId: string;
  dueDate: string;
  linkedRequirements: string[];
}

interface Step5ExecutionProps {
  data: A3WizardData;
}

export function Step5Execution({ data }: Step5ExecutionProps) {
  const { data: teamMembers = [] } = useTeamMembers();
  const [actions, setActions] = useState<LocalAction[]>([]);

  const addAction = () => {
    setActions(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        responsibleId: "",
        dueDate: "",
        linkedRequirements: []
      }
    ]);
  };

  const updateAction = (id: string, updates: Partial<LocalAction>) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAction = (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const toggleRequirementLink = (actionId: string, reqCode: string) => {
    setActions(prev => prev.map(a => {
      if (a.id !== actionId) return a;
      const linked = a.linkedRequirements.includes(reqCode)
        ? a.linkedRequirements.filter(r => r !== reqCode)
        : [...a.linkedRequirements, reqCode];
      return { ...a, linkedRequirements: linked };
    }));
  };

  // Coverage analysis
  const coverage = data.requirements.map(req => {
    const linkedActions = actions.filter(a => 
      a.linkedRequirements.includes(req.code) && a.description.trim() !== ""
    );
    return {
      code: req.code,
      indicator: req.indicator_name,
      actionCount: linkedActions.length,
      covered: linkedActions.length > 0
    };
  });

  const uncoveredCount = coverage.filter(c => !c.covered).length;
  const validActionsCount = actions.filter(a => 
    a.description.trim() !== "" && a.linkedRequirements.length > 0
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              5
            </span>
            Execução
          </CardTitle>
          <CardDescription>
            O que vamos fazer? Defina as ações e vincule aos requisitos que serão impactados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ação adicionada ainda.</p>
              <p className="text-sm">Adicione ações e vincule aos requisitos definidos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-4 bg-card space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Ação {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAction(action.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Responsável</Label>
                      <Select
                        value={action.responsibleId}
                        onValueChange={(value) => updateAction(action.id, { responsibleId: value })}
                      >
                        <SelectTrigger>
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
                    </div>

                    <div className="space-y-2">
                      <Label>Prazo</Label>
                      <Input
                        type="date"
                        value={action.dueDate}
                        onChange={(e) => updateAction(action.id, { dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Requisitos Impactados *</Label>
                    <div className="flex flex-wrap gap-2">
                      {data.requirements.map((req) => (
                        <label
                          key={req.code}
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
                      ))}
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
              {coverage.map((c) => (
                <div
                  key={c.code}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg",
                    c.covered ? "bg-success/10" : "bg-destructive/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{c.code}</span>
                    <span className="text-sm text-muted-foreground">{c.indicator}</span>
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
              ))}
            </div>

            {uncoveredCount > 0 && (
              <p className="text-sm text-destructive mt-3">
                ⚠️ {uncoveredCount} requisito(s) sem ações vinculadas
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Dica
        </h4>
        <p className="text-sm text-muted-foreground">
          Cada requisito deve ter pelo menos uma ação vinculada. Isso garante rastreabilidade e permite análise de eficácia das ações durante o acompanhamento.
        </p>
      </div>
    </div>
  );
}
