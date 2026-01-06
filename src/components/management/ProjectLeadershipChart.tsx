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
import type { ProjectLeader } from "@/hooks/useProjectLeadershipData";

interface ProjectLeadershipChartProps {
  leaders: ProjectLeader[];
}

export function ProjectLeadershipChart({ leaders }: ProjectLeadershipChartProps) {
  // Limit to top 10 leaders with most projects
  const chartData = leaders
    .slice(0, 10)
    .map((leader) => ({
      name: leader.leaderName.split(" ")[0], // First name only
      Saudável: leader.healthy,
      Atenção: leader.attention,
      Crítico: leader.critical,
      "Sem Status": leader.noStatus,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projetos por Líder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum projeto com líder atribuído
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projetos por Líder</CardTitle>
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
                dataKey="Sem Status"
                stackId="a"
                fill="hsl(var(--muted-foreground))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Saudável"
                stackId="a"
                fill="hsl(142.1 76.2% 36.3%)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Atenção"
                stackId="a"
                fill="hsl(47.9 95.8% 53.1%)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Crítico"
                stackId="a"
                fill="hsl(0 84.2% 60.2%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
