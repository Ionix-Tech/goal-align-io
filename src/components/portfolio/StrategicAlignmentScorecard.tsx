import { Target, FolderKanban, BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PillarAlignmentRow } from "./PillarAlignmentRow";
import { AlignmentProgressBar } from "./AlignmentProgressBar";
import { useStrategicAlignment } from "@/hooks/useStrategicAlignment";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, subtitle, icon: Icon, trend }: MetricCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50 text-center">
      <Icon className="h-5 w-5 text-muted-foreground mb-2" />
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{title}</span>
      {subtitle && (
        <span className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</span>
      )}
    </div>
  );
}

export function StrategicAlignmentScorecard() {
  const { data, isLoading, error } = useStrategicAlignment();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Erro ao carregar dados de alinhamento estratégico.
        </CardContent>
      </Card>
    );
  }

  const { pillars, metrics } = data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Alinhamento Estratégico
            </CardTitle>
            <CardDescription>
              Cobertura de objetivos estratégicos por projetos ativos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">Score Geral</span>
            <span className={cn(
              "text-2xl font-bold",
              metrics.coverageScore >= 75 ? "text-green-600" :
              metrics.coverageScore >= 50 ? "text-amber-500" : "text-red-500"
            )}>
              {metrics.coverageScore}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            icon={Target}
            title="Teses"
            value={`${metrics.coveredTheses}/${metrics.totalTheses}`}
            subtitle="cobertas"
          />
          <MetricCard
            icon={FolderKanban}
            title="Projetos"
            value={metrics.totalProjects}
            subtitle="vinculados"
          />
          <MetricCard
            icon={BarChart3}
            title="Com KPIs"
            value={metrics.thesesWithKPIs}
            subtitle="de {metrics.totalTheses} teses"
          />
          <MetricCard
            icon={TrendingUp}
            title="Média"
            value={metrics.averageProjectsPerThesis}
            subtitle="projetos/tese"
          />
        </div>

        {/* Pillars Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Cobertura por Pilar</h4>
          {pillars.length > 0 ? (
            pillars.map(pillar => (
              <PillarAlignmentRow key={pillar.id} pillar={pillar} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pilar estratégico configurado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
