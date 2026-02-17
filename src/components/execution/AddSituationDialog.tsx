import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSituation, useUpdateSituation } from "@/hooks/useProjectSituations";
import { useUploadAttachment } from "@/hooks/useSituationAttachments";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, X, Upload, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AddSituationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  editingSituation?: any;
}

function ImageUploadBox({
  label,
  imageFile,
  existingPath,
  onFileSelect,
  onRemove,
}: {
  label: string;
  imageFile: File | null;
  existingPath: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (existingPath) {
      supabase.storage
        .from('project-attachments')
        .createSignedUrl(existingPath, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setPreviewUrl(data.signedUrl);
        });
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile, existingPath]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem excede o limite de 10MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    onFileSelect(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-40 object-contain rounded-lg border bg-muted/30"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-sm">Clique para adicionar imagem</span>
          <span className="text-xs">PNG, JPG (max 10MB)</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
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
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [targetImageFile, setTargetImageFile] = useState<File | null>(null);
  const [existingCurrentImagePath, setExistingCurrentImagePath] = useState<string | null>(null);
  const [existingTargetImagePath, setExistingTargetImagePath] = useState<string | null>(null);
  const [removedCurrentImage, setRemovedCurrentImage] = useState(false);
  const [removedTargetImage, setRemovedTargetImage] = useState(false);

  const createSituation = useCreateSituation();
  const updateSituation = useUpdateSituation();
  const uploadAttachment = useUploadAttachment();

  useEffect(() => {
    if (editingSituation) {
      setCurrentProblem(editingSituation.current_problem || "");
      setTargetGoal(editingSituation.target_goal || "");
      setExistingCurrentImagePath(editingSituation.current_image_path || null);
      setExistingTargetImagePath(editingSituation.target_image_path || null);
    } else {
      setCurrentProblem("");
      setTargetGoal("");
      setAttachments([]);
      setExistingCurrentImagePath(null);
      setExistingTargetImagePath(null);
    }
    setCurrentImageFile(null);
    setTargetImageFile(null);
    setRemovedCurrentImage(false);
    setRemovedTargetImage(false);
  }, [editingSituation, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
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

  async function uploadImage(file: File, situationId: string, type: 'current' | 'target'): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `situations/${situationId}/${type}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('project-attachments')
      .upload(path, file);
    if (error) throw error;
    return path;
  }

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
        // Upload new images if selected
        let currentImagePath = removedCurrentImage ? null : existingCurrentImagePath;
        let targetImagePath = removedTargetImage ? null : existingTargetImagePath;

        if (currentImageFile) {
          currentImagePath = await uploadImage(currentImageFile, editingSituation.id, 'current');
        }
        if (targetImageFile) {
          targetImagePath = await uploadImage(targetImageFile, editingSituation.id, 'target');
        }

        await updateSituation.mutateAsync({
          situationId: editingSituation.id,
          projectId,
          currentProblem: currentProblem.trim(),
          targetGoal: targetGoal.trim(),
          currentImagePath,
          targetImagePath,
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

        // Upload situation images
        let currentImagePath: string | null = null;
        let targetImagePath: string | null = null;

        if (currentImageFile) {
          currentImagePath = await uploadImage(currentImageFile, result.id, 'current');
        }
        if (targetImageFile) {
          targetImagePath = await uploadImage(targetImageFile, result.id, 'target');
        }

        // Update situation with image paths if any were uploaded
        if (currentImagePath || targetImagePath) {
          await updateSituation.mutateAsync({
            situationId: result.id,
            projectId,
            currentImagePath,
            targetImagePath,
          });
        }

        // Upload general attachments if any
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
            <ImageUploadBox
              label="Imagem da Situação Atual (AS-IS)"
              imageFile={currentImageFile}
              existingPath={removedCurrentImage ? null : existingCurrentImagePath}
              onFileSelect={(file) => { setCurrentImageFile(file); setRemovedCurrentImage(false); }}
              onRemove={() => { setCurrentImageFile(null); setExistingCurrentImagePath(null); setRemovedCurrentImage(true); }}
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
            <ImageUploadBox
              label="Imagem da Situação Alvo (TO-BE)"
              imageFile={targetImageFile}
              existingPath={removedTargetImage ? null : existingTargetImagePath}
              onFileSelect={(file) => { setTargetImageFile(file); setRemovedTargetImage(false); }}
              onRemove={() => { setTargetImageFile(null); setExistingTargetImagePath(null); setRemovedTargetImage(true); }}
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
