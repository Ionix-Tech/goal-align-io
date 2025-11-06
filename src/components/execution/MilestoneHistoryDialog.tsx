import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMilestoneUpdates } from "@/hooks/useMilestoneUpdates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, TrendingUp } from "lucide-react";

interface MilestoneHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneId: string;
  milestoneTitle: string;
}

export function MilestoneHistoryDialog({
  open,
  onOpenChange,
  milestoneId,
  milestoneTitle
}: MilestoneHistoryDialogProps) {
  const { data: updates, isLoading } = useMilestoneUpdates(milestoneId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Progresso</DialogTitle>
          <p className="text-sm text-muted-foreground">{milestoneTitle}</p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : !updates || updates.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <p>Nenhuma atualização registrada ainda</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            updates.map((update, index) => {
              const isFirst = index === 0;
              const previousProgress = index < updates.length - 1
                ? updates[index + 1].progress_percentage
                : 0;
              const progressDelta = update.progress_percentage - previousProgress;

              return (
                <Card key={update.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={update.updater.avatar_url || undefined} />
                            <AvatarFallback>
                              {update.updater.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{update.updater.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(update.updated_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {update.is_critical && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Crítico
                            </Badge>
                          )}
                          {isFirst && (
                            <Badge variant="secondary">Mais recente</Badge>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Progress Info */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-primary">
                            {update.progress_percentage}%
                          </span>
                          {progressDelta > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1">
                              <TrendingUp className="h-3 w-3" />
                              +{progressDelta}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {update.notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium mb-1">Observações:</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {update.notes}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
