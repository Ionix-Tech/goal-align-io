import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSituation, useUpdateSituation } from "@/hooks/useProjectSituations";
import { Loader2 } from "lucide-react";

interface AddSituationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  editingSituation?: any;
}

export function AddSituationDialog({
  open,
  onOpenChange,
  projectId,
  editingSituation
}: AddSituationDialogProps) {
  const [currentProblem, setCurrentProblem] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [numericCurrent, setNumericCurrent] = useState("");
  const [numericTarget, setNumericTarget] = useState("");
  const [unit, setUnit] = useState("");

  const createSituation = useCreateSituation();
  const updateSituation = useUpdateSituation();

  useEffect(() => {
    if (editingSituation) {
      setCurrentProblem(editingSituation.current_problem || "");
      setTargetGoal(editingSituation.target_goal || "");
      setNumericCurrent(editingSituation.numeric_current?.toString() || "");
      setNumericTarget(editingSituation.numeric_target?.toString() || "");
      setUnit(editingSituation.unit || "");
    } else {
      setCurrentProblem("");
      setTargetGoal("");
      setNumericCurrent("");
      setNumericTarget("");
      setUnit("");
    }
  }, [editingSituation, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProblem.trim() || !targetGoal.trim()) {
      return;
    }

    const data = {
      projectId,
      currentProblem: currentProblem.trim(),
      targetGoal: targetGoal.trim(),
      numericCurrent: numericCurrent ? parseFloat(numericCurrent) : undefined,
      numericTarget: numericTarget ? parseFloat(numericTarget) : undefined,
      unit: unit.trim() || undefined
    };

    if (editingSituation) {
      await updateSituation.mutateAsync({
        situationId: editingSituation.id,
        ...data
      });
    } else {
      await createSituation.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isLoading = createSituation.isPending || updateSituation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingSituation ? "Editar Situação" : "Adicionar Nova Situação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Problem */}
          <div className="space-y-2">
            <Label htmlFor="current-problem">
              Situação Atual / Problema <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="current-problem"
              placeholder="Descreva o problema ou situação atual que precisa ser resolvida..."
              value={currentProblem}
              onChange={(e) => setCurrentProblem(e.target.value)}
              required
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Target Goal */}
          <div className="space-y-2">
            <Label htmlFor="target-goal">
              Situação Alvo / Meta <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="target-goal"
              placeholder="Descreva a meta ou situação desejada que se quer alcançar..."
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              required
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Numeric Values (Optional) */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Valores Numéricos (Opcional)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="numeric-current" className="text-xs">
                  Valor Atual
                </Label>
                <Input
                  id="numeric-current"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 150"
                  value={numericCurrent}
                  onChange={(e) => setNumericCurrent(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeric-target" className="text-xs">
                  Valor Alvo
                </Label>
                <Input
                  id="numeric-target"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 200"
                  value={numericTarget}
                  onChange={(e) => setNumericTarget(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-xs">
                  Unidade
                </Label>
                <Input
                  id="unit"
                  type="text"
                  placeholder="Ex: kg, %, dias"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSituation ? "Salvar Alterações" : "Criar Situação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
