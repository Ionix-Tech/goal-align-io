import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUpdateMilestoneDate } from "@/hooks/useUpdateMilestoneDate";

interface EditMilestoneDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: {
    id: string;
    title: string;
    target_date: string;
  } | null;
}

export function EditMilestoneDateDialog({
  open,
  onOpenChange,
  milestone,
}: EditMilestoneDateDialogProps) {
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");
  const { mutate: updateDate, isPending } = useUpdateMilestoneDate();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNewDate(undefined);
      setReason("");
    } else if (milestone) {
      setNewDate(new Date(milestone.target_date));
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    if (!milestone || !newDate) return;

    updateDate(
      {
        milestoneId: milestone.id,
        oldDate: milestone.target_date,
        newDate: format(newDate, "yyyy-MM-dd"),
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      }
    );
  };

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Data do Milestone</DialogTitle>
          <DialogDescription>
            Altere a data alvo do milestone. O histórico de alterações será mantido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Milestone Title */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Milestone</Label>
            <p className="font-medium">{milestone.title}</p>
          </div>

          {/* Current Date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Data Atual</Label>
            <p className="font-medium">
              {format(new Date(milestone.target_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* New Date */}
          <div className="space-y-2">
            <Label htmlFor="new-date">Nova Data Alvo *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="new-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDate ? (
                    format(newDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a nova data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Alteração (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Atraso na entrega do fornecedor..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!newDate || isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
