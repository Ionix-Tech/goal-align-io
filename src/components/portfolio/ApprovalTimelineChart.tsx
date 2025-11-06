import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApprovalTimeline } from "@/hooks/useApprovalTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function ApprovalTimelineChart() {
  const { data, isLoading } = useApprovalTimeline();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Aprovações</CardTitle>
          <CardDescription>Histórico de aprovações nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    const changeIcon = data.changeFromPrevious !== undefined ? (
      data.changeFromPrevious > 0 ? (
        <TrendingUp className="h-3 w-3 text-green-600" />
      ) : data.changeFromPrevious < 0 ? (
        <TrendingDown className="h-3 w-3 text-red-600" />
      ) : (
        <Minus className="h-3 w-3 text-muted-foreground" />
      )
    ) : null;

    return (
      <div className="bg-popover text-popover-foreground px-4 py-3 rounded-lg shadow-lg border max-w-xs">
        <div className="font-semibold mb-2">{data.monthLabel}</div>
        <div className="text-sm mb-2">
          <span className="font-medium">{data.count}</span> {data.count === 1 ? 'aprovação' : 'aprovações'}
        </div>
        
        {data.changeFromPrevious !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            {changeIcon}
            <span>
              {data.changeFromPrevious > 0 ? '+' : ''}
              {data.changeFromPrevious.toFixed(1)}% vs mês anterior
            </span>
          </div>
        )}

        {data.projects && data.projects.length > 0 && (
          <div className="mt-2 pt-2 border-t text-xs">
            <div className="font-medium mb-1">Projetos aprovados:</div>
            <ul className="space-y-0.5 max-h-32 overflow-y-auto">
              {data.projects.map((project: string, idx: number) => (
                <li key={idx} className="text-muted-foreground">• {project}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline de Aprovações</CardTitle>
        <CardDescription>
          Histórico nos últimos 6 meses • Média: {data.averagePerMonth.toFixed(1)} aprovações/mês
          {data.peakMonth && ` • Pico: ${data.peakMonth.monthLabel} (${data.peakMonth.count})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="approvalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="monthLabel" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={data.averagePerMonth} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ 
                value: 'Média', 
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12,
                position: 'right'
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              fill="url(#approvalGradient)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
