import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCreateIndicator } from '@/hooks/useIndicators';
import { supabase } from '@/integrations/supabase/client';

interface BankKPI {
  id: string;
  name: string;
  unit: string | null;
  target_value: number | null;
}

interface AddIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function AddIndicatorDialog({ open, onOpenChange, projectId }: AddIndicatorDialogProps) {
  const [name, setName] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [targetState, setTargetState] = useState('');
  const [unit, setUnit] = useState('');
  const [displayFormat, setDisplayFormat] = useState('percentage');
  const [ytdMode, setYtdMode] = useState('accumulated');
  const [bankKPIs, setBankKPIs] = useState<BankKPI[]>([]);
  const createIndicator = useCreateIndicator();

  // CHG-16: Fetch KPIs from indicator bank (thesis_kpis)
  useEffect(() => {
    if (open) {
      supabase
        .from('thesis_kpis')
        .select('id, name, unit, target_value')
        .then(({ data }) => setBankKPIs(data || []));
    }
  }, [open]);

  const selectFromBank = (kpi: BankKPI) => {
    setName(kpi.name);
    setUnit(kpi.unit || '');
    setTargetState(kpi.target_value?.toString() || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !currentState.trim() || !targetState.trim()) return;

    await createIndicator.mutateAsync({
      projectId,
      name: name.trim(),
      currentState: currentState.trim(),
      targetState: targetState.trim(),
      unit: unit.trim() || undefined
    });

    setName('');
    setCurrentState('');
    setTargetState('');
    setUnit('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Indicador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CHG-16: Select from indicator bank */}
          {bankKPIs.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Selecionar do Banco de Indicadores</Label>
                <Select onValueChange={(id) => {
                  const kpi = bankKPIs.find(k => k.id === id);
                  if (kpi) selectFromBank(kpi);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolher KPI existente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankKPIs.map(kpi => (
                      <SelectItem key={kpi.id} value={kpi.id}>
                        {kpi.name} {kpi.unit ? `(${kpi.unit})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Ou preencha manualmente abaixo</p>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Indicador *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Taxa de Conversão"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentState">Estado Atual *</Label>
            <Input
              id="currentState"
              value={currentState}
              onChange={(e) => setCurrentState(e.target.value)}
              placeholder="Ex: 15"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetState">Meta *</Label>
            <Input
              id="targetState"
              value={targetState}
              onChange={(e) => setTargetState(e.target.value)}
              placeholder="Ex: 25"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade (opcional)</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ex: %, unidades, R$..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Exibição Mensal</Label>
              <Select value={displayFormat} onValueChange={setDisplayFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="absolute">Valor Absoluto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>YTD</Label>
              <Select value={ytdMode} onValueChange={setYtdMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accumulated">Acumulado Total</SelectItem>
                  <SelectItem value="average">Média</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createIndicator.isPending}>
              {createIndicator.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
