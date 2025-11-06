import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePipelineMetrics } from "@/hooks/usePipelineMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown } from "lucide-react";

export function PipelineFunnelChart() {
  const { data: metrics, isLoading } = usePipelineMetrics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Funil</CardTitle>
          <CardDescription>Fluxo de projetos através dos estágios</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...metrics.stages.map(s => s.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Funil</CardTitle>
        <CardDescription>
          Fluxo de projetos através dos estágios • Taxa de aprovação: {metrics.overallConversionRate.toFixed(1)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.stages.map((stage, index) => {
            const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const showConversion = index < metrics.stages.length - 1;

            return (
              <div key={stage.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.name}</span>
                  <span className="text-muted-foreground">{stage.count} projetos</span>
                </div>
                
                <div 
                  className="relative h-12 rounded-lg transition-all duration-300 hover:opacity-90 cursor-pointer group"
                  style={{ 
                    width: `${Math.max(widthPercentage, 15)}%`,
                    backgroundColor: stage.fill,
                    marginLeft: `${(100 - widthPercentage) / 2}%`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg drop-shadow-md">
                      {stage.count}
                    </span>
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md text-xs whitespace-nowrap border">
                      <div className="font-semibold">{stage.name}</div>
                      <div>{stage.count} projetos</div>
                      {stage.conversionRate !== undefined && stage.conversionRate > 0 && (
                        <div className="text-muted-foreground">
                          Taxa: {stage.conversionRate.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {showConversion && stage.conversionRate !== undefined && stage.conversionRate > 0 && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <TrendingDown className="h-3 w-3" />
                    <span>{stage.conversionRate.toFixed(1)}% conversão</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total no Pipeline</span>
            <span className="font-semibold">{metrics.totalProjects} projetos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
