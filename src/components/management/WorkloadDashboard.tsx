import { useWorkloadData } from "@/hooks/useWorkloadData";
import { WorkloadMemberCard } from "./WorkloadMemberCard";
import { WorkloadChart } from "./WorkloadChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, ListTodo, Users } from "lucide-react";

export function WorkloadDashboard() {
  const { data, isLoading, error } = useWorkloadData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[150px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Erro ao carregar dados de carga de trabalho
        </CardContent>
      </Card>
    );
  }

  const overloadedCount = data.members.filter(
    (m) => m.workloadLevel === "overloaded"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Responsável</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.unassignedTasks}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.overdueTasks}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Membros Sobrecarregados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overloadedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <WorkloadChart members={data.members} />

      {/* Member Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Carga por Membro</h3>
        {data.members.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhum membro encontrado
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.members.map((member) => (
              <WorkloadMemberCard key={member.memberId} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
