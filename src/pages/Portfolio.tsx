import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioMetrics } from "@/hooks/usePortfolioMetrics";
import { PortfolioKPICard } from "@/components/portfolio/PortfolioKPICard";
import { PillarDistributionChart } from "@/components/portfolio/PillarDistributionChart";
import { HealthStatusChart } from "@/components/portfolio/HealthStatusChart";
import { AttentionRequiredCard } from "@/components/portfolio/AttentionRequiredCard";
import { PipelineFunnelChart } from "@/components/portfolio/PipelineFunnelChart";
import { ApprovalTimelineChart } from "@/components/portfolio/ApprovalTimelineChart";
import { 
  FolderKanban, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2,
  BarChart3,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Portfolio() {
  const { data: metrics, isLoading } = usePortfolioMetrics();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfólio Estratégico</h1>
            <p className="text-muted-foreground">
              Visão consolidada do portfólio de projetos estratégicos
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <PortfolioKPICard
          title="Total de Projetos"
          value={metrics.totalProjects}
          subtitle="No portfólio"
          icon={FolderKanban}
        />
        
        <PortfolioKPICard
          title="Investimento"
          value="—"
          subtitle="Em breve"
          icon={DollarSign}
          variant="default"
        />
        
        <PortfolioKPICard
          title="Projetos Críticos"
          value={metrics.criticalProjects}
          subtitle="Requerem atenção"
          icon={AlertTriangle}
          variant={metrics.criticalProjects > 0 ? "critical" : "default"}
        />
        
        <PortfolioKPICard
          title="Taxa de Aprovação"
          value={`${metrics.approvalRate}%`}
          subtitle="Do pipeline"
          icon={TrendingUp}
          variant="success"
        />
        
        <PortfolioKPICard
          title="Concluídos"
          value={metrics.completedProjects}
          subtitle="Marcos completos"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PillarDistributionChart data={metrics.pillarDistribution} />
        <HealthStatusChart data={metrics.healthDistribution} />
        <PipelineFunnelChart />
        <ApprovalTimelineChart />
      </div>

      {/* Attention Required Section */}
      {metrics.attentionRequired.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle>Requer Atenção do CEO</CardTitle>
            </div>
            <CardDescription>
              {metrics.attentionRequired.length} {metrics.attentionRequired.length === 1 ? 'projeto requer' : 'projetos requerem'} sua atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.attentionRequired.map((project) => (
              <AttentionRequiredCard
                key={project.id}
                projectId={project.id}
                projectName={project.name}
                reason={project.reason}
                severity={project.severity}
                status={project.status}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* No alerts message */}
      {metrics.attentionRequired.length === 0 && (
        <Card className="border-green-500/50 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="font-semibold text-lg">Tudo sob controle!</h3>
              <p className="text-sm text-muted-foreground">
                Nenhum projeto requer atenção imediata no momento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
