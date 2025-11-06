import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIndicatorUpdates } from "@/hooks/useIndicatorUpdates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown } from "lucide-react";

interface IndicatorEvolutionChartProps {
  indicatorId: string;
  indicatorName: string;
  targetValue?: string;
  unit?: string | null;
}

export function IndicatorEvolutionChart({
  indicatorId,
  indicatorName,
  targetValue,
  unit
}: IndicatorEvolutionChartProps) {
  const { data: updates, isLoading } = useIndicatorUpdates(indicatorId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Carregando dados...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Nenhuma medição registrada ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data (reverse to show oldest first)
  const chartData = [...updates]
    .reverse()
    .map(update => {
      // Try to parse measured_value as number
      const numericValue = parseFloat(update.measured_value.replace(/[^\d.-]/g, ''));

      return {
        date: format(new Date(update.measurement_date), "dd/MM", { locale: ptBR }),
        fullDate: format(new Date(update.measurement_date), "dd 'de' MMM", { locale: ptBR }),
        value: !isNaN(numericValue) ? numericValue : 0,
        displayValue: update.measured_value,
        progress: update.progress_percentage
      };
    });

  // Calculate trend
  const firstValue = chartData[0]?.value || 0;
  const lastValue = chartData[chartData.length - 1]?.value || 0;
  const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
  const trendPercentage = firstValue !== 0
    ? Math.round(((lastValue - firstValue) / firstValue) * 100)
    : 0;

  // Parse target value if available
  const numericTarget = targetValue ? parseFloat(targetValue.replace(/[^\d.-]/g, '')) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{indicatorName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Evolução temporal {unit && `(${unit})`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {trend === 'up' && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">+{Math.abs(trendPercentage)}%</span>
              </div>
            )}
            {trend === 'down' && (
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-5 w-5" />
                <span className="font-semibold">-{Math.abs(trendPercentage)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              style={{ fontSize: '12px' }}
              label={{ value: unit || '', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-sm">{data.fullDate}</p>
                      <p className="text-sm">Valor: <span className="font-bold text-primary">{data.displayValue}</span></p>
                      <p className="text-sm">Progresso: <span className="font-bold">{data.progress}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              name="Valor Medido"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            {numericTarget && !isNaN(numericTarget) && (
              <Line
                type="monotone"
                dataKey={() => numericTarget}
                stroke="#82ca9d"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Meta"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Primeira Medição</p>
            <p className="text-lg font-bold">{chartData[0]?.displayValue}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Última Medição</p>
            <p className="text-lg font-bold text-primary">{chartData[chartData.length - 1]?.displayValue}</p>
          </div>
          {targetValue && (
            <div>
              <p className="text-xs text-muted-foreground">Meta</p>
              <p className="text-lg font-bold text-green-600">{targetValue}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
