import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { A3WizardData, WizardAction, WizardWhyLink } from "@/hooks/useA3WizardState";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Plus, Trash2, AlertCircle, CheckCircle, Link, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step5ExecutionProps {
  data: A3WizardData;
  addAction: () => void;
  updateAction: (id: string, updates: Partial<WizardAction>) => void;
  removeAction: (id: string) => void;
  addWhyLink: () => void;
  updateWhyLink: (id: string, updates: Partial<WizardWhyLink>) => void;
  removeWhyLink: (id: string) => void;
}

export function Step5Execution({ 
  data, 
  addAction, 
  updateAction, 
  removeAction,
  addWhyLink,
  updateWhyLink,
  removeWhyLink
}: Step5ExecutionProps) {
  const { data: teamMembers = [] } = useTeamMembers();

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
      indicator: req.indicator_name,
      actionCount: linkedActions.length,
      covered: linkedActions.length > 0
    };
  });

  const uncoveredCount = coverage.filter(c => !c.covered).length;

  return (
    <div className="space-y-6">
      {/* Actions Section */}
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
          {data.actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ação adicionada ainda.</p>
              <p className="text-sm">Adicione ações e vincule aos requisitos definidos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.actions.map((action, index) => (
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
          Cada requisito deve ter pelo menos uma ação vinculada. Isso garante rastreabilidade e permite análise de eficácia das ações durante o acompanhamento.
        </p>
      </div>
    </div>
  );
}
