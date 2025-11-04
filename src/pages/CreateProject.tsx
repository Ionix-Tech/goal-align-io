import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Indicator {
  id: string;
  currentState: string;
  targetState: string;
}

interface Milestone {
  id: string;
  title: string;
  targetDate: string;
}

const CreateProject = () => {
  const [projectName, setProjectName] = useState("");
  const [context, setContext] = useState("");
  const [strategicPillar, setStrategicPillar] = useState("");
  const [objective, setObjective] = useState("");
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const addIndicator = () => {
    const newIndicator: Indicator = {
      id: crypto.randomUUID(),
      currentState: "",
      targetState: "",
    };
    setIndicators([...indicators, newIndicator]);
  };

  const removeIndicator = (id: string) => {
    setIndicators(indicators.filter((ind) => ind.id !== id));
  };

  const updateIndicator = (id: string, field: keyof Indicator, value: string) => {
    setIndicators(
      indicators.map((ind) =>
        ind.id === id ? { ...ind, [field]: value } : ind
      )
    );
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      title: "",
      targetDate: "",
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((mile) => mile.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(
      milestones.map((mile) =>
        mile.id === id ? { ...mile, [field]: value } : mile
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName || !context || !strategicPillar || !objective) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // TODO: Save to database
    toast.success("Projeto criado com sucesso!");
    console.log({
      projectName,
      context,
      strategicPillar,
      objective,
      indicators,
      milestones,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Criar Novo Projeto</h1>
          <p className="text-muted-foreground">
            Estruture seu projeto estratégico seguindo a metodologia A3
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome do Projeto */}
          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-base font-semibold">
                Nome do Projeto *
              </Label>
              <Input
                id="projectName"
                placeholder="Ex: Redução de Custos Operacionais"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-base"
              />
            </div>
          </Card>

          {/* Contexto */}
          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="context" className="text-base font-semibold">
                Contexto *
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Qual é o problema ou oportunidade que este projeto aborda?
              </p>
              <Textarea
                id="context"
                placeholder="Descreva o contexto, problema atual ou oportunidade..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>
          </Card>

          {/* Pilar Estratégico */}
          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="pillar" className="text-base font-semibold">
                Pilar Estratégico *
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                A qual pilar estratégico da empresa este projeto está alinhado?
              </p>
              <Input
                id="pillar"
                placeholder="Ex: Eficiência Operacional, Crescimento de Receita..."
                value={strategicPillar}
                onChange={(e) => setStrategicPillar(e.target.value)}
                className="text-base"
              />
            </div>
          </Card>

          {/* Objetivo */}
          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="objective" className="text-base font-semibold">
                Objetivo *
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                O que você pretende alcançar com este projeto?
              </p>
              <Textarea
                id="objective"
                placeholder="Descreva o objetivo de forma clara e mensurável..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="min-h-[80px] text-base"
              />
            </div>
          </Card>

          {/* Indicadores */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold mb-1">Indicadores</h3>
                <p className="text-sm text-muted-foreground">
                  Como você vai medir o sucesso? Defina como está hoje e onde quer chegar.
                </p>
              </div>

              <div className="space-y-3">
                {indicators.map((indicator, index) => (
                  <div
                    key={indicator.id}
                    className="p-4 border rounded-lg bg-background space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Indicador {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIndicator(indicator.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-sm">Como está hoje</Label>
                        <Input
                          placeholder="Ex: 45% de retrabalho"
                          value={indicator.currentState}
                          onChange={(e) =>
                            updateIndicator(indicator.id, "currentState", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Meta desejada</Label>
                        <Input
                          placeholder="Ex: 15% de retrabalho"
                          value={indicator.targetState}
                          onChange={(e) =>
                            updateIndicator(indicator.id, "targetState", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addIndicator}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Indicador
              </Button>
            </div>
          </Card>

          {/* Milestones */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold mb-1">Milestones Relevantes</h3>
                <p className="text-sm text-muted-foreground">
                  Marcos importantes do projeto e suas datas estimadas.
                </p>
              </div>

              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="p-4 border rounded-lg bg-background space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Milestone {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(milestone.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-sm">Título</Label>
                        <Input
                          placeholder="Ex: Conclusão da Fase 1"
                          value={milestone.title}
                          onChange={(e) =>
                            updateMilestone(milestone.id, "title", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Data Prevista</Label>
                        <Input
                          type="date"
                          value={milestone.targetDate}
                          onChange={(e) =>
                            updateMilestone(milestone.id, "targetDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addMilestone}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Milestone
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancelar
            </Button>
            <Button type="submit" size="lg">
              Criar Projeto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
