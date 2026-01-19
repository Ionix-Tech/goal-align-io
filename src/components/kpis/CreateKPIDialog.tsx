import { useState, useEffect } from 'react';
import { useCreateKPI, KPIType, KPIDirection, KPI } from '@/hooks/useKPIs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Target, Building2, Crosshair, AlertCircle } from 'lucide-react';

interface CreateKPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: KPIType;
  pillars: { id: string; name: string }[];
  theses: { id: string; name: string }[];
  areas: { id: string; name: string; code: string }[];
  teamMembers: { id: string; full_name: string }[];
  existingKPIs: KPI[];
}

const typeLabels: Record<KPIType, { label: string; icon: React.ReactNode; description: string }> = {
  strategic: {
    label: 'Estratégico',
    icon: <Target className="h-4 w-4" />,
    description: 'Vinculado a Pilar e Objetivo estratégico da empresa'
  },
  area: {
    label: 'Área',
    icon: <Building2 className="h-4 w-4" />,
    description: 'Derivado de um KPI Estratégico, vinculado a uma área'
  },
  control: {
    label: 'Controle',
    icon: <Crosshair className="h-4 w-4" />,
    description: 'Indicador avulso para controle tático ou operacional'
  }
};

export function CreateKPIDialog({
  open,
  onOpenChange,
  defaultType,
  pillars,
  theses,
  areas,
  teamMembers,
  existingKPIs
}: CreateKPIDialogProps) {
  const createKPI = useCreateKPI();
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    kpi_type: defaultType,
    pillar_id: '',
    objective_id: '',
    parent_kpi_id: '',
    area_id: '',
    context_type: 'area' as 'area' | 'strategic',
    unit: '',
    direction: 'higher_better' as KPIDirection,
    target_type: 'fixed' as 'fixed' | 'variable',
    default_target: '',
    owner_id: '',
    year: currentYear
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(prev => ({ ...prev, kpi_type: defaultType }));
  }, [defaultType]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unidade é obrigatória';
    }
    if (!formData.owner_id) {
      newErrors.owner_id = 'Responsável é obrigatório';
    }

    // Type-specific validations
    if (formData.kpi_type === 'strategic') {
      if (!formData.pillar_id) {
        newErrors.pillar_id = 'Pilar é obrigatório para KPI Estratégico';
      }
      if (!formData.objective_id) {
        newErrors.objective_id = 'Objetivo é obrigatório para KPI Estratégico';
      }
    }

    if (formData.kpi_type === 'area') {
      if (!formData.parent_kpi_id) {
        newErrors.parent_kpi_id = 'KPI Pai é obrigatório para KPI de Área';
      }
      if (!formData.area_id) {
        newErrors.area_id = 'Área é obrigatória para KPI de Área';
      }
    }

    if (formData.kpi_type === 'control') {
      if (formData.context_type === 'area' && !formData.area_id) {
        newErrors.area_id = 'Área é obrigatória quando contexto é Área';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await createKPI.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      kpi_type: formData.kpi_type,
      pillar_id: formData.kpi_type === 'strategic' ? formData.pillar_id : undefined,
      objective_id: formData.kpi_type === 'strategic' ? formData.objective_id : undefined,
      parent_kpi_id: formData.kpi_type === 'area' ? formData.parent_kpi_id : undefined,
      area_id: (formData.kpi_type === 'area' || (formData.kpi_type === 'control' && formData.context_type === 'area')) 
        ? formData.area_id 
        : undefined,
      context_type: formData.kpi_type === 'control' ? formData.context_type : undefined,
      unit: formData.unit,
      direction: formData.direction,
      target_type: formData.target_type,
      default_target: formData.default_target ? parseFloat(formData.default_target) : undefined,
      owner_id: formData.owner_id,
      year: formData.year
    });

    onOpenChange(false);
    setFormData({
      name: '',
      description: '',
      kpi_type: defaultType,
      pillar_id: '',
      objective_id: '',
      parent_kpi_id: '',
      area_id: '',
      context_type: 'area',
      unit: '',
      direction: 'higher_better',
      target_type: 'fixed',
      default_target: '',
      owner_id: '',
      year: currentYear
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {typeLabels[formData.kpi_type].icon}
            Criar KPI {typeLabels[formData.kpi_type].label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* KPI Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de KPI</Label>
            <RadioGroup
              value={formData.kpi_type}
              onValueChange={(value) => setFormData({ ...formData, kpi_type: value as KPIType })}
              className="grid grid-cols-3 gap-3"
            >
              {Object.entries(typeLabels).map(([type, info]) => (
                <div key={type} className="relative">
                  <RadioGroupItem value={type} id={type} className="peer sr-only" />
                  <Label
                    htmlFor={type}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    {info.icon}
                    <span className="mt-1 text-sm font-medium">{info.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {typeLabels[formData.kpi_type].description}
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nome do KPI *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Receita Líquida Mensal"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Descrição / Fórmula</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o indicador e como é calculado..."
                rows={2}
              />
            </div>
          </div>

          {/* Strategic KPI Fields */}
          {formData.kpi_type === 'strategic' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label>Pilar *</Label>
                <Select
                  value={formData.pillar_id}
                  onValueChange={(value) => setFormData({ ...formData, pillar_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o pilar" />
                  </SelectTrigger>
                  <SelectContent>
                    {pillars.map(pillar => (
                      <SelectItem key={pillar.id} value={pillar.id}>{pillar.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pillar_id && <p className="text-xs text-destructive">{errors.pillar_id}</p>}
              </div>

              <div className="space-y-2">
                <Label>Objetivo *</Label>
                <Select
                  value={formData.objective_id}
                  onValueChange={(value) => setFormData({ ...formData, objective_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {theses.map(thesis => (
                      <SelectItem key={thesis.id} value={thesis.id}>{thesis.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.objective_id && <p className="text-xs text-destructive">{errors.objective_id}</p>}
              </div>
            </div>
          )}

          {/* Area KPI Fields */}
          {formData.kpi_type === 'area' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label>KPI Estratégico Pai *</Label>
                <Select
                  value={formData.parent_kpi_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_kpi_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o KPI pai" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingKPIs.map(kpi => (
                      <SelectItem key={kpi.id} value={kpi.id}>{kpi.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parent_kpi_id && <p className="text-xs text-destructive">{errors.parent_kpi_id}</p>}
              </div>

              <div className="space-y-2">
                <Label>Área *</Label>
                <Select
                  value={formData.area_id}
                  onValueChange={(value) => setFormData({ ...formData, area_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.area_id && <p className="text-xs text-destructive">{errors.area_id}</p>}
              </div>
            </div>
          )}

          {/* Control KPI Fields */}
          {formData.kpi_type === 'control' && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label>Contexto *</Label>
                <RadioGroup
                  value={formData.context_type}
                  onValueChange={(value) => setFormData({ ...formData, context_type: value as 'area' | 'strategic' })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="area" id="context-area" />
                    <Label htmlFor="context-area">Área (preferencial)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="strategic" id="context-strategic" />
                    <Label htmlFor="context-strategic">Estratégico (empresa)</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.context_type === 'area' && (
                <div className="space-y-2">
                  <Label>Área *</Label>
                  <Select
                    value={formData.area_id}
                    onValueChange={(value) => setFormData({ ...formData, area_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.area_id && <p className="text-xs text-destructive">{errors.area_id}</p>}
                </div>
              )}
            </div>
          )}

          {/* Measurement Config */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="R$, %, #, dias"
              />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
            </div>

            <div className="space-y-2">
              <Label>Direção</Label>
              <Select
                value={formData.direction}
                onValueChange={(value) => setFormData({ ...formData, direction: value as KPIDirection })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="higher_better">Maior é melhor ↑</SelectItem>
                  <SelectItem value="lower_better">Menor é melhor ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Meta</Label>
              <Select
                value={formData.target_type}
                onValueChange={(value) => setFormData({ ...formData, target_type: value as 'fixed' | 'variable' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Mensal Fixa</SelectItem>
                  <SelectItem value="variable">Mensal Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Meta Padrão</Label>
              <Input
                type="number"
                value={formData.default_target}
                onChange={(e) => setFormData({ ...formData, default_target: e.target.value })}
                placeholder="100"
              />
            </div>
          </div>

          {/* Owner and Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsável *</Label>
              <Select
                value={formData.owner_id}
                onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.owner_id && <p className="text-xs text-destructive">{errors.owner_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                  <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                  <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {areas.length === 0 && (formData.kpi_type === 'area' || formData.kpi_type === 'control') && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma área cadastrada. Cadastre áreas em Configurações antes de criar KPIs de Área ou Controle.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createKPI.isPending}>
            {createKPI.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar KPI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
