import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateThesis, type Thesis } from "@/hooks/useTheses";
import { toast } from "sonner";

interface EditThesisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thesis: Thesis | null;
}

export function EditThesisDialog({ open, onOpenChange, thesis }: EditThesisDialogProps) {
  // Default to next year for new objectives
  const nextYear = new Date().getFullYear() + 1;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    objective: "",
    year: nextYear,
    period_start: `${nextYear}-01-01`,
    period_end: `${nextYear}-12-31`,
  });

  const updateThesis = useUpdateThesis();

  // Carregar dados da thesis quando abrir o dialog
  useEffect(() => {
    if (thesis && open) {
      setFormData({
        name: thesis.name || "",
        description: thesis.description || "",
        objective: thesis.objective || "",
        year: thesis.year,
        period_start: thesis.period_start,
        period_end: thesis.period_end,
      });
    }
  }, [thesis, open]);

  const handleSubmit = async () => {
    if (!thesis) return;
    
    try {
      await updateThesis.mutateAsync({
        id: thesis.id,
        ...formData,
      });
      toast.success("Objetivo atualizado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating thesis:", error);
      toast.error("Erro ao atualizar objetivo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Objetivo Estratégico</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="name">Nome do Objetivo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: ALMA"
            />
          </div>

          <div>
            <Label htmlFor="objective">Descrição do Objetivo *</Label>
            <Textarea
              id="objective"
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              placeholder="Descreva o objetivo estratégico"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="description">Detalhes Adicionais</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informações complementares"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year">Ano *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="period_start">Data Início *</Label>
              <Input
                id="period_start"
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="period_end">Data Fim *</Label>
              <Input
                id="period_end"
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={updateThesis.isPending || !formData.name || !formData.objective}
          >
            {updateThesis.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
