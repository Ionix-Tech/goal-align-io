import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIndicatorUpdates } from "@/hooks/useIndicatorUpdates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown } from "lucide-react";

interface IndicatorHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicatorId: string;
  indicatorName: string;
  unit?: string | null;
}

export function IndicatorHistoryDialog({
  open,
  onOpenChange,
  indicatorId,
  indicatorName,
  unit
}: IndicatorHistoryDialogProps) {
  const { data: updates, isLoading } = useIndicatorUpdates(indicatorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Medições</DialogTitle>
          <p className="text-sm text-muted-foreground">{indicatorName}</p>
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
                  <p>Nenhuma medição registrada ainda</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            updates.map((update, index) => {
              const isFirst = index === 0;
              const previousValue = index < updates.length - 1
                ? updates[index + 1].measured_value
                : null;

              // Try to determine trend if both are numeric
              let trend: 'up' | 'down' | 'stable' | null = null;
              if (previousValue) {
                const currentNum = parseFloat(update.measured_value.replace(/[^\d.-]/g, ''));
                const previousNum = parseFloat(previousValue.replace(/[^\d.-]/g, ''));

                if (!isNaN(currentNum) && !isNaN(previousNum)) {
                  if (currentNum > previousNum) {
                    trend = 'up';
                  } else if (currentNum < previousNum) {
                    trend = 'down';
                  } else {
                    trend = 'stable';
                  }
                }
              }

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
                              Medição em: {format(new Date(update.measurement_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isFirst && (
                            <Badge variant="secondary">Mais recente</Badge>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Measured Value */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-primary">
                            {update.measured_value}
                            {unit && <span className="text-lg ml-1">{unit}</span>}
                          </span>
                          {trend === 'up' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Subiu
                            </Badge>
                          )}
                          {trend === 'down' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Caiu
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="bg-muted/50 rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Progresso da Meta</span>
                          <span className="text-lg font-bold">{update.progress_percentage}%</span>
                        </div>
                      </div>

                      {/* Previous Value Comparison */}
                      {previousValue && (
                        <p className="text-xs text-muted-foreground">
                          Medição anterior: {previousValue} {unit}
                        </p>
                      )}

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
