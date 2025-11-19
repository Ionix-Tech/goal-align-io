import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTaskDateHistory } from "@/hooks/useTaskDateHistory";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskDateHistoryDialogProps {
  taskId: string | null;
  taskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDateHistoryDialog({
  taskId,
  taskTitle,
  open,
  onOpenChange
}: TaskDateHistoryDialogProps) {
  const { data: history, isLoading } = useTaskDateHistory(taskId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Datas - {taskTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : history && history.length > 0 ? (
            history.map((entry) => (
              <div
                key={entry.id}
                className="border rounded-lg p-4 space-y-2 bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.changer.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{entry.changer.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(entry.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">De:</span>
                  <span className="font-medium">
                    {entry.old_date ? format(parseISO(entry.old_date), "dd/MM/yyyy", { locale: ptBR }) : "Sem data"}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-primary">
                    {entry.new_date ? format(parseISO(entry.new_date), "dd/MM/yyyy", { locale: ptBR }) : "Sem data"}
                  </span>
                </div>

                {entry.reason && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Motivo: </span>
                    <span>{entry.reason}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma alteração de data registrada
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
