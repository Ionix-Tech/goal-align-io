import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Cell } from "recharts";

interface HealthStatusChartProps {
  data: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export function HealthStatusChart({ data }: HealthStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Status dos Aprovados</CardTitle>
          <CardDescription>
            Nenhum projeto aprovado com status de saúde
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">
            Sem dados disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = data.reduce((acc, item, index) => {
    acc[`health${index}`] = {
      label: item.name,
      color: item.fill,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Status dos Aprovados</CardTitle>
        <CardDescription>
          {total} {total === 1 ? 'projeto aprovado' : 'projetos aprovados'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={90}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value) => [
                      `${value} (${Math.round((Number(value) / total) * 100)}%)`,
                      ''
                    ]}
                  />
                }
              />
              <Bar 
                dataKey="value" 
                fill="fill"
                radius={[0, 4, 4, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
