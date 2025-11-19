import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIndicatorUpdates } from "@/hooks/useIndicatorUpdates";
import { IndicatorEvolutionChart } from "./IndicatorEvolutionChart";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown } from "lucide-react";

interface IndicatorHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicatorId: string;
  indicatorName: string;
  targetValue?: string;
  unit?: string | null;
}

export function IndicatorHistoryDialog({
  open,
  onOpenChange,
  indicatorId,
  indicatorName,
  targetValue,
  unit
}: IndicatorHistoryDialogProps) {
  const { data: updates, isLoading } = useIndicatorUpdates(indicatorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Medições</DialogTitle>
          <p className="text-sm text-muted-foreground">{indicatorName}</p>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">📋 Detalhes</TabsTrigger>
            <TabsTrigger value="chart">📊 Gráfico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
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
                              {index === 0 && (
                                <Badge variant="secondary">Mais recente</Badge>
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* Measured Value */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-primary">
                              {update.measured_value}
                            </span>
                            {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
                            {trend && (
                              <div className="ml-2">
                                {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
                                {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
                              </div>
                            )}
                          </div>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progresso da Meta</span>
                              <span className="font-semibold">{update.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{ width: `${Math.min(update.progress_percentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          {update.notes && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Observações</p>
                                <p className="text-sm text-muted-foreground">{update.notes}</p>
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
          </TabsContent>

          <TabsContent value="chart" className="flex-1 overflow-y-auto mt-4">
            <IndicatorEvolutionChart
              indicatorId={indicatorId}
              indicatorName={indicatorName}
              targetValue={targetValue}
              unit={unit}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
