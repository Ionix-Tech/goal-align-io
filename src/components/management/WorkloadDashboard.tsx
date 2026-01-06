import { useState } from "react";
import { useWorkloadData } from "@/hooks/useWorkloadData";
import { useProjectLeadershipData } from "@/hooks/useProjectLeadershipData";
import { WorkloadMemberCard } from "./WorkloadMemberCard";
import { WorkloadChart } from "./WorkloadChart";
import { ProjectLeaderCard } from "./ProjectLeaderCard";
import { ProjectLeadershipChart } from "./ProjectLeadershipChart";
import { WorkloadAIInsights } from "./WorkloadAIInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, ListTodo, Users, FolderKanban, AlertCircle } from "lucide-react";

export function WorkloadDashboard() {
  const [activeTab, setActiveTab] = useState<"tasks" | "projects">("tasks");
  const { data: workloadData, isLoading: workloadLoading, error: workloadError } = useWorkloadData();
  const { data: leadershipData, isLoading: leadershipLoading, error: leadershipError } = useProjectLeadershipData();

  const isLoading = workloadLoading || leadershipLoading;
  const error = workloadError || leadershipError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[100px] w-full" />
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Erro ao carregar dados de carga de trabalho
        </CardContent>
      </Card>
    );
  }

  const overloadedMembersCount = workloadData?.members.filter(
    (m) => m.workloadLevel === "overloaded"
  ).length || 0;

  const overloadedLeadersCount = leadershipData?.leaders.filter(
    (l) => l.leadershipLevel === "overloaded"
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tasks" | "projects")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Projetos
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workloadData?.totalTasks || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sem Responsável</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {workloadData?.unassignedTasks || 0}
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
                  {workloadData?.overdueTasks || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Membros Sobrecarregados
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {overloadedMembersCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {workloadData && <WorkloadChart members={workloadData.members} />}

          {/* Member Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Carga por Membro</h3>
            {!workloadData?.members.length ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhum membro encontrado
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workloadData.members.map((member) => (
                  <WorkloadMemberCard key={member.memberId} member={member} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leadershipData?.totalProjects || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sem Líder</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {leadershipData?.unassignedProjects || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projetos Críticos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {leadershipData?.criticalProjects || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Líderes Sobrecarregados
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {overloadedLeadersCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {leadershipData && <ProjectLeadershipChart leaders={leadershipData.leaders} />}

          {/* Leader Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Projetos por Líder</h3>
            {!leadershipData?.leaders.length ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhum projeto com líder atribuído
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leadershipData.leaders.map((leader) => (
                  <ProjectLeaderCard key={leader.leaderId} leader={leader} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Insights - at the end */}
      <WorkloadAIInsights workloadData={workloadData} leadershipData={leadershipData} />
    </div>
  );
}
