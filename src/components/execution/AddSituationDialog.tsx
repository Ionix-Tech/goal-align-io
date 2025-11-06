import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSituation, useUpdateSituation } from "@/hooks/useProjectSituations";
import { useCreateSituationIndicator } from "@/hooks/useSituationIndicators";
import { useUploadAttachment } from "@/hooks/useSituationAttachments";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface AddSituationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  editingSituation?: any;
}

interface IndicatorForm {
  id: string;
  name: string;
  currentValue: string;
  targetValue: string;
  unit: string;
}

export function AddSituationDialog({
  open,
  onOpenChange,
  projectId,
  editingSituation
}: AddSituationDialogProps) {
  const { user } = useAuth();
  const [currentProblem, setCurrentProblem] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [indicators, setIndicators] = useState<IndicatorForm[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  const createSituation = useCreateSituation();
  const updateSituation = useUpdateSituation();
  const createIndicator = useCreateSituationIndicator();
  const uploadAttachment = useUploadAttachment();

  useEffect(() => {
    if (editingSituation) {
      setCurrentProblem(editingSituation.current_problem || "");
      setTargetGoal(editingSituation.target_goal || "");
      
      // Load existing indicators
      if (editingSituation.indicators && editingSituation.indicators.length > 0) {
        setIndicators(editingSituation.indicators.map((ind: any) => ({
          id: ind.id,
          name: ind.name,
          currentValue: ind.current_value?.toString() || "",
          targetValue: ind.target_value?.toString() || "",
          unit: ind.unit || ""
        })));
      } else {
        setIndicators([]);
      }
    } else {
      setCurrentProblem("");
      setTargetGoal("");
      setIndicators([]);
      setAttachments([]);
    }
  }, [editingSituation, open]);

  const addIndicator = () => {
    setIndicators([...indicators, {
      id: crypto.randomUUID(),
      name: "",
      currentValue: "",
      targetValue: "",
      unit: ""
    }]);
  };

  const removeIndicator = (id: string) => {
    setIndicators(indicators.filter(ind => ind.id !== id));
  };

  const updateIndicatorField = (id: string, field: keyof IndicatorForm, value: string) => {
    setIndicators(indicators.map(ind => 
      ind.id === id ? { ...ind, [field]: value } : ind
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Validate file sizes (50MB max each)
      const validFiles = newFiles.filter(file => {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} excede o limite de 50MB`);
          return false;
        }
        return true;
      });

      setAttachments([...attachments, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProblem.trim() || !targetGoal.trim()) {
      toast.error("Preencha situação atual e situação alvo");
      return;
    }

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      if (editingSituation) {
        // Update existing situation
        await updateSituation.mutateAsync({
          situationId: editingSituation.id,
          projectId,
          currentProblem: currentProblem.trim(),
          targetGoal: targetGoal.trim()
        });

        // TODO: Handle indicators update (for now, new indicators only via create)
      } else {
        // Create new situation
        const indicatorsData = indicators
          .filter(ind => ind.name.trim() && ind.currentValue && ind.targetValue)
          .map((ind, index) => ({
            name: ind.name.trim(),
            currentValue: parseFloat(ind.currentValue),
            targetValue: parseFloat(ind.targetValue),
            unit: ind.unit.trim() || undefined,
            displayOrder: index
          }));

        const result = await createSituation.mutateAsync({
          projectId,
          currentProblem: currentProblem.trim(),
          targetGoal: targetGoal.trim(),
          indicators: indicatorsData.length > 0 ? indicatorsData : undefined,
          linkedTasks: undefined
        });

        // Upload attachments if any
        if (attachments.length > 0 && result.id) {
          await Promise.all(
            attachments.map(file => 
              uploadAttachment.mutateAsync({
                situationId: result.id,
                file,
                userId: user.id
              })
            )
          );
        }
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving situation:", error);
      toast.error("Erro ao salvar situação: " + error.message);
    }
  };

  const isLoading = createSituation.isPending || updateSituation.isPending || uploadAttachment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSituation ? "Editar Situação" : "Adicionar Nova Situação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Problem */}
          <div className="space-y-2">
            <Label htmlFor="current-problem">
              Situação Atual / Problema <span className="text-destructive">*</span>
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
              Situação Alvo / Meta <span className="text-destructive">*</span>
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

          {/* Indicators Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Indicadores</p>
                <p className="text-xs text-muted-foreground">
                  Métricas para acompanhar a evolução da situação atual para a alvo
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addIndicator}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {indicators.map((indicator) => (
                <div key={indicator.id} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Nome do Indicador</Label>
                    <Input
                      placeholder="Ex: Taxa de Retrabalho"
                      value={indicator.name}
                      onChange={(e) => updateIndicatorField(indicator.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_0.7fr_auto] gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Valor Atual</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="45"
                        value={indicator.currentValue}
                        onChange={(e) => updateIndicatorField(indicator.id, "currentValue", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Valor Alvo</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="15"
                        value={indicator.targetValue}
                        onChange={(e) => updateIndicatorField(indicator.id, "targetValue", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unidade</Label>
                      <Input
                        placeholder="%"
                        value={indicator.unit}
                        onChange={(e) => updateIndicatorField(indicator.id, "unit", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIndicator(indicator.id)}
                      className="self-end"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {indicators.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum indicador adicionado ainda
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {!editingSituation && (
            <div className="border-t pt-4">
              <div className="mb-3">
                <p className="text-sm font-medium">Anexos</p>
                <p className="text-xs text-muted-foreground">
                  PDFs, PPTs, documentos de processo (máx 50MB cada)
                </p>
              </div>

              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">📎</span>
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivos
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
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
