import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRequirement } from "@/hooks/useRequirements";
import { toast } from "sonner";

interface AddRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  nextCode: string;
  nextDisplayOrder: number;
}

export function AddRequirementDialog({
  open,
  onOpenChange,
  projectId,
  nextCode,
  nextDisplayOrder,
}: AddRequirementDialogProps) {
  const [description, setDescription] = useState("");
  const createRequirement = useCreateRequirement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error("Preencha a descrição do requisito");
      return;
    }

    await createRequirement.mutateAsync({
      project_id: projectId,
      code: nextCode,
      description: description.trim(),
      display_order: nextDisplayOrder,
    });

    toast.success("Requisito adicionado");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Requisito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Código</Label>
            <Input value={nextCode} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Requisito *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o requisito de sucesso do projeto..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createRequirement.isPending}>
              {createRequirement.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
