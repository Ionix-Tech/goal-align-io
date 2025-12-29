import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { ProjectRequirement } from "@/hooks/useRequirements";

interface Step2RequirementsProps {
  data: A3WizardData;
  addRequirement: () => void;
  updateRequirement: (index: number, updates: Partial<ProjectRequirement>) => void;
  removeRequirement: (index: number) => void;
}

export function Step2Requirements({
  data,
  addRequirement,
  updateRequirement,
  removeRequirement
}: Step2RequirementsProps) {
  const canAddMore = data.requirements.length < 6;
  const validCount = data.requirements.filter(
    r => r.description.trim() !== ""
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              2
            </span>
            Requisitos
          </CardTitle>
          <CardDescription>
            O que precisa dar certo? Defina de 2 a 6 requisitos que indicam sucesso do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.requirements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum requisito adicionado ainda.</p>
              <p className="text-sm">Adicione pelo menos 2 requisitos para continuar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.requirements.map((req, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-card space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                      {req.code}
                    </span>
                    {data.requirements.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`desc-${index}`}>O que precisa dar certo? *</Label>
                    <Input
                      id={`desc-${index}`}
                      value={req.description}
                      onChange={(e) => updateRequirement(index, { description: e.target.value })}
                      placeholder="Ex: Reduzir taxa de retrabalho no processo X"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {validCount} de {data.requirements.length} requisitos válidos
              {validCount < 2 && (
                <span className="text-destructive ml-2">(mínimo 2 necessários)</span>
              )}
            </div>
            
            <Button
              onClick={addRequirement}
              disabled={!canAddMore}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Requisito
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Dica
        </h4>
        <p className="text-sm text-muted-foreground">
          Requisitos são critérios de sucesso do projeto. Pense: "Se isso não melhorar, o projeto não terá cumprido seu objetivo". 
          Os indicadores serão definidos e correlacionados aos requisitos em etapa posterior.
        </p>
      </div>
    </div>
  );
}
