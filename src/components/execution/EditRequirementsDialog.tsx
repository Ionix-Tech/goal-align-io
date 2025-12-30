import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useUpdateRequirement, useDeleteRequirement, type ProjectRequirement } from "@/hooks/useRequirements";
import { toast } from "sonner";

interface EditRequirementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  requirements: ProjectRequirement[];
}

export function EditRequirementsDialog({
  open,
  onOpenChange,
  projectId,
  requirements,
}: EditRequirementsDialogProps) {
  const [editedRequirements, setEditedRequirements] = useState<ProjectRequirement[]>([]);
  const updateRequirement = useUpdateRequirement();
  const deleteRequirement = useDeleteRequirement();

  useEffect(() => {
    setEditedRequirements([...requirements]);
  }, [requirements, open]);

  const handleDescriptionChange = (id: string, description: string) => {
    setEditedRequirements(prev => 
      prev.map(req => req.id === id ? { ...req, description } : req)
    );
  };

  const handleDelete = async (id: string) => {
    if (editedRequirements.length <= 1) {
      toast.error("O projeto deve ter pelo menos 1 requisito");
      return;
    }

    await deleteRequirement.mutateAsync({ id, projectId });
    setEditedRequirements(prev => prev.filter(req => req.id !== id));
  };

  const handleSave = async () => {
    const changedRequirements = editedRequirements.filter(edited => {
      const original = requirements.find(r => r.id === edited.id);
      return original && original.description !== edited.description;
    });

    for (const req of changedRequirements) {
      await updateRequirement.mutateAsync({
        id: req.id,
        projectId,
        description: req.description,
      });
    }

    if (changedRequirements.length > 0) {
      toast.success("Requisitos atualizados");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Requisitos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {editedRequirements.map((req) => (
            <div key={req.id} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  {req.code}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(req.id)}
                  disabled={editedRequirements.length <= 1 || deleteRequirement.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`desc-${req.id}`} className="text-xs text-muted-foreground">
                  Descrição
                </Label>
                <Input
                  id={`desc-${req.id}`}
                  value={req.description}
                  onChange={(e) => handleDescriptionChange(req.id, e.target.value)}
                  placeholder="Descrição do requisito..."
                />
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateRequirement.isPending}
          >
            {updateRequirement.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
