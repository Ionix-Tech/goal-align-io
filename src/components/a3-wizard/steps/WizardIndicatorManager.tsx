import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Link2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface WizardIndicator {
  id: string;
  name: string;
  unit: string;
  currentValue: string;
  targetValue: string;
  linkedRequirementCodes: string[];
}

interface RequirementOption {
  code: string;
  description: string;
}

interface WizardIndicatorManagerProps {
  indicators: WizardIndicator[];
  onIndicatorsChange: (indicators: WizardIndicator[]) => void;
  requirements: RequirementOption[];
}

export function WizardIndicatorManager({ 
  indicators, 
  onIndicatorsChange,
  requirements 
}: WizardIndicatorManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newIndicator, setNewIndicator] = useState({
    name: "",
    unit: "",
    currentValue: "",
    targetValue: ""
  });

  const handleAdd = () => {
    if (!newIndicator.name.trim() || !newIndicator.currentValue.trim() || !newIndicator.targetValue.trim()) {
      return;
    }

    const indicator: WizardIndicator = {
      id: crypto.randomUUID(),
      name: newIndicator.name.trim(),
      unit: newIndicator.unit.trim(),
      currentValue: newIndicator.currentValue,
      targetValue: newIndicator.targetValue,
      linkedRequirementCodes: []
    };

    onIndicatorsChange([...indicators, indicator]);
    setNewIndicator({ name: "", unit: "", currentValue: "", targetValue: "" });
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onIndicatorsChange(indicators.filter(i => i.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<WizardIndicator>) => {
    onIndicatorsChange(indicators.map(i => 
      i.id === id ? { ...i, ...updates } : i
    ));
  };

  const toggleRequirementLink = (indicatorId: string, code: string) => {
    const indicator = indicators.find(i => i.id === indicatorId);
    if (!indicator) return;

    const newCodes = indicator.linkedRequirementCodes.includes(code)
      ? indicator.linkedRequirementCodes.filter(c => c !== code)
      : [...indicator.linkedRequirementCodes, code];

    handleUpdate(indicatorId, { linkedRequirementCodes: newCodes });
  };

  return (
    <div className="space-y-4">
      {indicators.length === 0 && !isAdding && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm mb-2">Nenhum indicador definido ainda.</p>
          <p className="text-xs">Adicione indicadores para medir o progresso do projeto.</p>
        </div>
      )}

      {/* Lista de indicadores */}
      <div className="space-y-3">
        {indicators.map((indicator) => (
          <Card key={indicator.id} className="border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{indicator.name}</span>
                    {indicator.unit && (
                      <span className="text-xs text-muted-foreground">({indicator.unit})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span>
                      Atual: <strong>{indicator.currentValue}</strong>
                    </span>
                    <span>→</span>
                    <span>
                      Meta: <strong className="text-success">{indicator.targetValue}</strong>
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(indicator.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Requisitos vinculados */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Requisitos:</span>
                {indicator.linkedRequirementCodes.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">Nenhum</span>
                ) : (
                  indicator.linkedRequirementCodes.map(code => (
                    <Badge 
                      key={code} 
                      variant="secondary" 
                      className="text-xs gap-1"
                    >
                      {code}
                      <button 
                        onClick={() => toggleRequirementLink(indicator.id, code)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
                      <Link2 className="h-3 w-3" />
                      Vincular
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Selecione os requisitos:
                      </p>
                      {requirements.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum requisito definido.</p>
                      ) : (
                        requirements.map(req => (
                          <label
                            key={req.code}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted",
                              indicator.linkedRequirementCodes.includes(req.code) && "bg-muted"
                            )}
                          >
                            <Checkbox
                              checked={indicator.linkedRequirementCodes.includes(req.code)}
                              onCheckedChange={() => toggleRequirementLink(indicator.id, req.code)}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-xs">{req.code}</span>
                              <p className="text-xs text-muted-foreground truncate">
                                {req.description}
                              </p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulário para adicionar novo indicador */}
      {isAdding ? (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Nome do Indicador *</Label>
                <Input
                  value={newIndicator.name}
                  onChange={(e) => setNewIndicator(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Taxa de retrabalho"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Unidade</Label>
                <Input
                  value={newIndicator.unit}
                  onChange={(e) => setNewIndicator(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Ex: %, un, R$"
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Valor Atual *</Label>
                  <Input
                    value={newIndicator.currentValue}
                    onChange={(e) => setNewIndicator(prev => ({ ...prev, currentValue: e.target.value }))}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Meta (90d) *</Label>
                  <Input
                    value={newIndicator.targetValue}
                    onChange={(e) => setNewIndicator(prev => ({ ...prev, targetValue: e.target.value }))}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewIndicator({ name: "", unit: "", currentValue: "", targetValue: "" });
                }}
              >
                Cancelar
              </Button>
              <Button 
                size="sm"
                onClick={handleAdd}
                disabled={!newIndicator.name.trim() || !newIndicator.currentValue.trim() || !newIndicator.targetValue.trim()}
              >
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button 
          variant="outline" 
          className="w-full gap-2 border-dashed"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" />
          Adicionar Indicador
        </Button>
      )}
    </div>
  );
}