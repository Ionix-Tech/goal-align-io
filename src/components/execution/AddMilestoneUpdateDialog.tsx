import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateMilestoneUpdate } from "@/hooks/useMilestoneUpdates";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddMilestoneUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneId: string;
  milestoneTitle: string;
  currentProgress: number;
}

export function AddMilestoneUpdateDialog({
  open,
  onOpenChange,
  milestoneId,
  milestoneTitle,
  currentProgress
}: AddMilestoneUpdateDialogProps) {
  const [progressPercentage, setProgressPercentage] = useState(currentProgress);
  const [isCritical, setIsCritical] = useState(false);
  const [markAsComplete, setMarkAsComplete] = useState(false);
  const [notes, setNotes] = useState("");

  const createUpdate = useCreateMilestoneUpdate();

  // Sincronizar estado quando o diálogo abre ou currentProgress muda
  useEffect(() => {
    if (open) {
      setProgressPercentage(currentProgress);
      setIsCritical(false);
      setNotes("");
      setMarkAsComplete(currentProgress === 100);
    }
  }, [open, currentProgress]);

  // Quando marcar como concluído, definir progresso para 100%
  useEffect(() => {
    if (markAsComplete) {
      setProgressPercentage(100);
    }
  }, [markAsComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createUpdate.mutateAsync({
      milestoneId,
      progressPercentage,
      isCritical,
      notes: notes.trim() || undefined
    });

    // Reset form
    setNotes("");
    setIsCritical(false);
    setMarkAsComplete(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atualizar Progresso do Milestone</DialogTitle>
          <DialogDescription>
            {milestoneTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Progresso Atual</Label>
              <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
            </div>
            <Slider
              value={[progressPercentage]}
              onValueChange={(value) => {
                if (!markAsComplete) {
                  setProgressPercentage(value[0]);
                }
              }}
              min={currentProgress}
              max={100}
              step={5}
              className={cn("w-full", markAsComplete && "opacity-50 pointer-events-none")}
              disabled={markAsComplete}
            />
            <p className="text-xs text-muted-foreground">
              Progresso anterior: {currentProgress}%
            </p>
          </div>

          {/* Marcar como Concluído */}
          <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900/30">
            <Checkbox
              id="complete"
              checked={markAsComplete}
              onCheckedChange={(checked) => setMarkAsComplete(checked === true)}
              disabled={currentProgress === 100}
            />
            <div className="flex-1">
              <Label
                htmlFor="complete"
                className="text-sm font-medium text-green-700 dark:text-green-400 cursor-pointer"
              >
                ✓ Marcar milestone como concluído
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Define automaticamente o progresso para 100%
              </p>
            </div>
          </div>

          {/* Critical Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="critical"
              checked={isCritical}
              onCheckedChange={(checked) => setIsCritical(checked === true)}
            />
            <Label
              htmlFor="critical"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Marcar como atualização crítica
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Descreva o que foi realizado, desafios enfrentados, próximos passos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
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
              Salvar Atualização
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
