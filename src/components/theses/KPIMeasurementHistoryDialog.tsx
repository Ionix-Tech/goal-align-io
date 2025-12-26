import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useThesisKPIMeasurements } from "@/hooks/useThesisKPIMeasurements";
import type { ThesisKPI } from "@/hooks/useThesisDetails";

interface KPIMeasurementHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: ThesisKPI | null;
}

export function KPIMeasurementHistoryDialog({
  open,
  onOpenChange,
  kpi,
}: KPIMeasurementHistoryDialogProps) {
  const { data: measurements, isLoading } = useThesisKPIMeasurements(kpi?.id);

  const chartData = measurements?.map((m) => ({
    date: format(new Date(m.measurement_date), "MMM/yy", { locale: ptBR }),
    value: Number(m.measured_value),
    fullDate: format(new Date(m.measurement_date), "dd/MM/yyyy", { locale: ptBR }),
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Histórico: {kpi?.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        ) : measurements && measurements.length > 0 ? (
          <div className="space-y-6">
            {/* Chart */}
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="text-sm font-medium">
                              {payload[0].payload.fullDate}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {Number(payload[0].value).toLocaleString('pt-BR')}{kpi?.unit ? ` ${kpi.unit}` : ''}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {kpi?.target_value && (
                    <ReferenceLine 
                      y={kpi.target_value} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="5 5"
                      label={{ 
                        value: `Meta: ${kpi.target_value.toLocaleString('pt-BR')}`, 
                        position: 'right',
                        fill: 'hsl(var(--primary))',
                        fontSize: 12 
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Measurement List */}
            <div>
              <h4 className="text-sm font-medium mb-3">Histórico de Medições</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {[...measurements].reverse().map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {Number(m.measured_value).toLocaleString('pt-BR')}{kpi?.unit ? ` ${kpi.unit}` : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            em {format(new Date(m.measurement_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        {m.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {m.notes}
                          </p>
                        )}
                        {m.profiles?.full_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Por: {m.profiles.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma medição registrada ainda
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
