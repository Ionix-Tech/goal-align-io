import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateThesis } from "@/hooks/useTheses";
import { useCreateThesisKPI } from "@/hooks/useThesisKPIs";
import { usePillars } from "@/hooks/usePillars";
import { THESIS_TEMPLATES } from "@/config/thesisTemplates";
import { ChevronLeft, ChevronRight, Heart, Brain, Zap } from "lucide-react";

interface CreateThesisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface KPIFormData {
  name: string;
  target_value: string;
  unit: string;
}

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  corpo: <Zap className="h-4 w-4 text-green-600" />,
  alma: <Heart className="h-4 w-4 text-rose-600" />,
  mente: <Brain className="h-4 w-4 text-violet-600" />,
};

export function CreateThesisDialog({ open, onOpenChange }: CreateThesisDialogProps) {
  const [step, setStep] = useState(1);
  const { data: pillars = [] } = usePillars();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    objective: string;
    year: number;
    period_start: string;
    period_end: string;
    thesis_type: "operational_efficiency" | "sales_expansion" | "new_business" | "custom";
    pillar_id: string;
    is_active: boolean;
    is_archived: boolean;
  }>(() => {
    const defaultYear = 2026;
    return {
      name: "",
      description: "",
      objective: "",
      year: defaultYear,
      period_start: `${defaultYear}-01-01`,
      period_end: `${defaultYear}-12-31`,
      thesis_type: "custom",
      pillar_id: "",
      is_active: true,
      is_archived: false
    };
  });
  const [kpis, setKpis] = useState<KPIFormData[]>([]);

  const createThesis = useCreateThesis();
  const createKPI = useCreateThesisKPI();

  const template = THESIS_TEMPLATES[formData.thesis_type];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      const thesis = await createThesis.mutateAsync(formData);
      
      // Criar KPIs
      for (const kpi of kpis) {
        if (kpi.name && kpi.target_value) {
          await createKPI.mutateAsync({
            thesis_id: thesis.id,
            name: kpi.name,
            target_value: parseFloat(kpi.target_value),
            unit: kpi.unit,
            current_value: null,
            description: null,
            display_order: 0
          });
        }
      }

      // Reset e fechar
      const defaultYear = 2026;
      setFormData({
        name: "",
        description: "",
        objective: "",
        year: defaultYear,
        period_start: `${defaultYear}-01-01`,
        period_end: `${defaultYear}-12-31`,
        thesis_type: "custom",
        pillar_id: "",
        is_active: true,
        is_archived: false
      });
      setKpis([]);
      setStep(1);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating thesis:", error);
    }
  };

  const addKPI = () => {
    setKpis([...kpis, { name: "", target_value: "", unit: "" }]);
  };

  const updateKPI = (index: number, field: keyof KPIFormData, value: string) => {
    const newKpis = [...kpis];
    newKpis[index][field] = value;
    setKpis(newKpis);
  };

  const removeKPI = (index: number) => {
    setKpis(kpis.filter((_, i) => i !== index));
  };

  const loadTemplateKPIs = () => {
    setKpis(template.defaultKPIs.map(kpi => ({
      name: kpi.name,
      target_value: "",
      unit: kpi.unit
    })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Objetivo Estratégico - Passo {step} de 3</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Informações Básicas */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pillar_id">Pilar Estratégico *</Label>
                <Select
                  value={formData.pillar_id}
                  onValueChange={(value) => setFormData({ ...formData, pillar_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o pilar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pillars.map((pillar) => (
                      <SelectItem key={pillar.id} value={pillar.id}>
                        <div className="flex items-center gap-2">
                          {PILLAR_ICONS[pillar.pillar_type]}
                          {pillar.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Nome do Objetivo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aumentar Eficiência Operacional"
                />
              </div>

              <div>
                <Label htmlFor="objective">Descrição do Objetivo *</Label>
                <Textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="Descreva o objetivo estratégico"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="description">Detalhes Adicionais</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Informações complementares"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="year">Ano *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="period_start">Data Início *</Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="period_end">Data Fim *</Label>
                  <Input
                    id="period_end"
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tipo de Objetivo */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="thesis_type">Tipo de Objetivo *</Label>
                <Select
                  value={formData.thesis_type}
                  onValueChange={(value: any) => setFormData({ ...formData, thesis_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(THESIS_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.icon} {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Sobre este tipo de objetivo:</h4>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    switch (formData.thesis_type) {
                      case 'operational_efficiency':
                        return 'Focada em otimizar processos, reduzir custos e aumentar produtividade operacional.';
                      case 'sales_expansion':
                        return 'Orientada para aumentar market share, receita e base de clientes.';
                      case 'new_business':
                        return 'Voltada para explorar novos mercados, produtos e oportunidades de negócio.';
                      case 'custom':
                        return 'Objetivo personalizado com metas específicas da organização.';
                      default:
                        return '';
                    }
                  })()}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: KPIs */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>KPIs Principais</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadTemplateKPIs}
                  >
                    Carregar KPIs do Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addKPI}
                  >
                    Adicionar KPI
                  </Button>
                </div>
              </div>

              {kpis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum KPI adicionado. Clique em "Carregar KPIs do Template" ou "Adicionar KPI".
                </div>
              ) : (
                <div className="space-y-4">
                  {kpis.map((kpi, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Nome do KPI</Label>
                        <Input
                          value={kpi.name}
                          onChange={(e) => updateKPI(index, 'name', e.target.value)}
                          placeholder="Ex: Redução de Custo"
                        />
                      </div>
                      <div className="w-32">
                        <Label>Meta</Label>
                        <Input
                          type="number"
                          value={kpi.target_value}
                          onChange={(e) => updateKPI(index, 'target_value', e.target.value)}
                          placeholder="100"
                        />
                      </div>
                      <div className="w-24">
                        <Label>Unidade</Label>
                        <Input
                          value={kpi.unit}
                          onChange={(e) => updateKPI(index, 'unit', e.target.value)}
                          placeholder="%"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeKPI(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {step < 3 ? (
            <Button onClick={handleNext}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={createThesis.isPending || !formData.name || !formData.objective || !formData.pillar_id}
            >
              Criar Objetivo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
