import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSituation, useUpdateSituation } from "@/hooks/useProjectSituations";
import { useUploadAttachment } from "@/hooks/useSituationAttachments";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [currentProblem, setCurrentProblem] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const createSituation = useCreateSituation();
  const updateSituation = useUpdateSituation();
  const uploadAttachment = useUploadAttachment();

  useEffect(() => {
    if (editingSituation) {
      setCurrentProblem(editingSituation.current_problem || "");
      setTargetGoal(editingSituation.target_goal || "");
    } else {
      setCurrentProblem("");
      setTargetGoal("");
      setAttachments([]);
    }
  }, [editingSituation, open]);

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
      } else {
        // Create new situation
        const result = await createSituation.mutateAsync({
          projectId,
          currentProblem: currentProblem.trim(),
          targetGoal: targetGoal.trim(),
          indicators: undefined,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
