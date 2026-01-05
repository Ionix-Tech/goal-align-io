import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkloadMember } from "@/hooks/useWorkloadData";

interface WorkloadChartProps {
  members: WorkloadMember[];
}

export function WorkloadChart({ members }: WorkloadChartProps) {
  // Limit to top 10 members with most tasks
  const chartData = members
    .slice(0, 10)
    .map((member) => ({
      name: member.memberName.split(" ")[0], // First name only
      "A fazer": member.notStarted,
      "Em progresso": member.inProgress,
      "Concluídas": member.completed,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição de Tarefas por Membro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="A fazer"
                stackId="a"
                fill="hsl(var(--muted-foreground))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Em progresso"
                stackId="a"
                fill="hsl(var(--primary))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Concluídas"
                stackId="a"
                fill="hsl(142.1 76.2% 36.3%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
