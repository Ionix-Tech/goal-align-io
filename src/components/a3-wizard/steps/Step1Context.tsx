import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { A3WizardData, StrategicKPI } from "@/hooks/useA3WizardState";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAllTheses } from "@/hooks/usePillars";
import { useKPIs } from "@/hooks/useKPIs";
import { PROJECT_CATEGORIES } from "@/config/categories";
import { Heart, Brain, Zap, X, Flame } from "lucide-react";

interface Step1ContextProps {
  data: A3WizardData;
  updateData: (updates: Partial<A3WizardData>) => void;
}

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  corpo: <Zap className="h-4 w-4 text-green-600" />,
  alma: <Heart className="h-4 w-4 text-rose-600" />,
  mente: <Brain className="h-4 w-4 text-violet-600" />,
};

const PILLAR_COLORS: Record<string, string> = {
  corpo: "border-green-300 bg-green-50 text-green-700",
  alma: "border-rose-300 bg-rose-50 text-rose-700",
  mente: "border-violet-300 bg-violet-50 text-violet-700",
};

export function Step1Context({ data, updateData }: Step1ContextProps) {
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: allTheses = [] } = useAllTheses();

  // Buscar KPIs estratégicos vinculados ao objetivo selecionado
  const kpiFilters = data.thesisId ? { objective_id: data.thesisId, kpi_type: 'strategic' as const } : undefined;
  const { data: strategicKPIs = [], isLoading: isLoadingKPIs } = useKPIs(kpiFilters);

  const availableKPIs = strategicKPIs.filter(
    kpi => !data.strategicKpis.some(selected => selected.kpiId === kpi.id)
  );

  const handleObjectiveChange = (value: string) => {
    const selectedThesis = allTheses.find(t => t.id === value);
    updateData({ 
      thesisId: value,
      pillarId: selectedThesis?.pillar_id || "",
      strategicIndicator: "",
      strategicKpis: []
    });
  };

  const handleAddKPI = (kpiId: string) => {
    const kpi = strategicKPIs.find(k => k.id === kpiId);
    if (!kpi) return;

    const newKPI: StrategicKPI = {
      id: crypto.randomUUID(),
      kpiId: kpi.id,
      kpiName: kpi.name
    };

    updateData({
      strategicKpis: [...data.strategicKpis, newKPI],
      // Also update legacy field for backwards compatibility
      strategicIndicator: data.strategicKpis.length === 0 ? kpi.name : data.strategicIndicator
    });
  };

  const handleRemoveKPI = (kpiId: string) => {
    const updatedKpis = data.strategicKpis.filter(k => k.kpiId !== kpiId);
    updateData({ 
      strategicKpis: updatedKpis,
      strategicIndicator: updatedKpis.length > 0 ? updatedKpis[0].kpiName : ""
    });
  };

  const handleAddMember = (memberId: string) => {
    if (!data.members.includes(memberId)) {
      updateData({ members: [...data.members, memberId] });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    updateData({ members: data.members.filter(id => id !== memberId) });
  };

  const availableMembers = teamMembers.filter(
    member => member.id !== data.assignedTo && !data.members.includes(member.id)
  );

  const selectedMembers = teamMembers.filter(member => data.members.includes(member.id));

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

          {/* Vinculação Estratégica */}
          <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
            <h4 className="font-medium text-sm">Vinculação Estratégica</h4>
            
            <div className="space-y-2">
              <Label htmlFor="objective-select">Objetivo Estratégico</Label>
              <Select
                value={data.thesisId}
                onValueChange={handleObjectiveChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o objetivo..." />
                </SelectTrigger>
                <SelectContent>
                  {allTheses.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>
                      <div className="flex items-center gap-2">
                        {obj.pillar && PILLAR_ICONS[obj.pillar.pillar_type]}
                        <span className="text-muted-foreground text-xs">
                          {obj.pillar?.name}
                        </span>
                        <span className="text-muted-foreground">›</span>
                        <span>{obj.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Indicadores (KRs) Estratégicos Impactados</Label>
              
              {/* Selected KPIs as badges */}
              {data.strategicKpis.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {data.strategicKpis.map((kpi) => {
                    const kpiDetails = strategicKPIs.find(k => k.id === kpi.kpiId);
                    return (
                      <Badge
                        key={kpi.kpiId}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {kpi.kpiName}
                        {kpiDetails?.unit && <span className="text-muted-foreground">({kpiDetails.unit})</span>}
                        <button
                          type="button"
                          onClick={() => handleRemoveKPI(kpi.kpiId)}
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {/* Dropdown to add more KPIs */}
              {!data.thesisId ? (
                <p className="text-sm text-muted-foreground">Selecione um objetivo primeiro</p>
              ) : isLoadingKPIs ? (
                <p className="text-sm text-muted-foreground">Carregando indicadores...</p>
              ) : availableKPIs.length > 0 ? (
                <Select onValueChange={handleAddKPI}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar indicador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableKPIs.map((kpi) => (
                      <SelectItem key={kpi.id} value={kpi.id}>
                        {kpi.name} {kpi.unit && `(${kpi.unit})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : data.strategicKpis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum indicador disponível para este objetivo</p>
              ) : null}
            </div>
          </div>

          {/* Projeto Crítico */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <Flame className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <Label htmlFor="is-critical" className="font-medium cursor-pointer">
                    Projeto Crítico
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Projetos críticos têm prioridade máxima e acompanhamento intensificado
                  </p>
                </div>
              </div>
              <Switch
                id="is-critical"
                checked={data.isCritical}
                onCheckedChange={(checked) => {
                  updateData({ 
                    isCritical: checked,
                    criticalReason: checked ? data.criticalReason : ""
                  });
                }}
              />
            </div>
            
            {data.isCritical && (
              <div className="pl-12 space-y-2">
                <Label htmlFor="critical-reason" className="text-sm">
                  Justificativa da criticidade *
                </Label>
                <Textarea
                  id="critical-reason"
                  value={data.criticalReason || ""}
                  onChange={(e) => updateData({ criticalReason: e.target.value })}
                  placeholder="Explique por que este projeto é considerado crítico..."
                  rows={2}
                  className="bg-background"
                />
              </div>
            )}
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

          {/* Membros do Time */}
          <div className="space-y-2">
            <Label>Membros do Time (opcional)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedMembers.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {member.full_name}
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {availableMembers.length > 0 && (
              <Select onValueChange={handleAddMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar membro..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Dica
        </h4>
        <p className="text-sm text-muted-foreground">
          Certifique-se de vincular o projeto a um Pilar e Objetivo Estratégico. Isso garante alinhamento com os OKRs da empresa e facilita o acompanhamento de resultados.
        </p>
      </div>
    </div>
  );
}
