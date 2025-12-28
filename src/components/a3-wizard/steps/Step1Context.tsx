import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTheses } from "@/hooks/useTheses";
import { PROJECT_CATEGORIES } from "@/config/categories";

interface Step1ContextProps {
  data: A3WizardData;
  updateData: (updates: Partial<A3WizardData>) => void;
}

export function Step1Context({ data, updateData }: Step1ContextProps) {
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: theses = [] } = useTheses({ includeArchived: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              1
            </span>
            Contexto
          </CardTitle>
          <CardDescription>
            O que é esse projeto? Defina as informações básicas do A3.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              placeholder="Ex: Redução de Retrabalho na Linha de Produção"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">Objetivo Estratégico *</Label>
            <Textarea
              id="objective"
              value={data.objective}
              onChange={(e) => updateData({ objective: e.target.value })}
              placeholder="Descreva o objetivo principal do projeto..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thesis">Tese Estratégica (OKR)</Label>
              <Select
                value={data.thesisId}
                onValueChange={(value) => updateData({ thesisId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a tese..." />
                </SelectTrigger>
                <SelectContent>
                  {theses.map((thesis) => (
                    <SelectItem key={thesis.id} value={thesis.id}>
                      {thesis.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategic-indicator">Indicador Macro Impactado</Label>
              <Input
                id="strategic-indicator"
                value={data.strategicIndicator}
                onChange={(e) => updateData({ strategicIndicator: e.target.value })}
                placeholder="Ex: OEE, Custo de Qualidade..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Área Responsável</Label>
              <Select
                value={data.category}
                onValueChange={(value) => updateData({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área..." />
                </SelectTrigger>
              <SelectContent>
                  {PROJECT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leader">Líder do Projeto</Label>
              <Select
                value={data.assignedTo}
                onValueChange={(value) => updateData({ assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o líder..." />
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
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Dica
        </h4>
        <p className="text-sm text-muted-foreground">
          Certifique-se de vincular o projeto a uma Tese Estratégica. Isso garante alinhamento com os OKRs da empresa e facilita o acompanhamento de resultados.
        </p>
      </div>
    </div>
  );
}
