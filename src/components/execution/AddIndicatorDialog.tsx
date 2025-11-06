import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateIndicator } from '@/hooks/useIndicators';

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
  const createIndicator = useCreateIndicator();

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
            <Label htmlFor="unit">Unidade</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ex: %, unidades, R$..."
            />
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
