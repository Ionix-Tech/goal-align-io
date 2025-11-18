import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useCreateIndicatorUpdate } from "@/hooks/useIndicatorUpdates";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface AddIndicatorMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicatorId: string;
  indicatorName: string;
  unit?: string | null;
  projectId: string;
}

export function AddIndicatorMeasurementDialog({
  open,
  onOpenChange,
  indicatorId,
  indicatorName,
  unit,
  projectId
}: AddIndicatorMeasurementDialogProps) {
  const [measuredValue, setMeasuredValue] = useState("");
  const [measurementDate, setMeasurementDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [notes, setNotes] = useState("");

  const createUpdate = useCreateIndicatorUpdate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!measuredValue.trim()) {
      return;
    }

    await createUpdate.mutateAsync({
      projectId,
      indicatorId,
      measuredValue: measuredValue.trim(),
      measurementDate,
      progressPercentage,
      notes: notes.trim() || undefined
    });

    // Reset form
    setMeasuredValue("");
    setMeasurementDate(format(new Date(), "yyyy-MM-dd"));
    setProgressPercentage(0);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Nova Medição</DialogTitle>
          <DialogDescription>
            {indicatorName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Measured Value */}
          <div className="space-y-2">
            <Label htmlFor="measured-value">
              Valor Medido {unit && <span className="text-muted-foreground">({unit})</span>}
            </Label>
            <Input
              id="measured-value"
              type="text"
              placeholder="Ex: 150, 87.5%, R$ 50.000"
              value={measuredValue}
              onChange={(e) => setMeasuredValue(e.target.value)}
              required
            />
          </div>

          {/* Measurement Date */}
          <div className="space-y-2">
            <Label htmlFor="measurement-date">Data da Medição</Label>
            <div className="relative">
              <Input
                id="measurement-date"
                type="date"
                value={measurementDate}
                onChange={(e) => setMeasurementDate(e.target.value)}
                required
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Progresso em Relação à Meta</Label>
              <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
            </div>
            <Slider
              value={[progressPercentage]}
              onValueChange={(value) => setProgressPercentage(value[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Quanto % da meta foi alcançado com essa medição?
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Contexto da medição, fatores que influenciaram, insights..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createUpdate.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createUpdate.isPending}
            >
              {createUpdate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Registrar Medição
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
