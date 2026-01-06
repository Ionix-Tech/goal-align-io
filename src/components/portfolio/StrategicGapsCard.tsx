import { AlertTriangle, AlertCircle, Info, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategicGap } from "@/hooks/useStrategicAlignment";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StrategicGapsCardProps {
  gaps: StrategicGap[];
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-900',
    label: 'Crítico',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-900',
    label: 'Atenção',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900',
    label: 'Informativo',
  },
};

function GapItem({ gap }: { gap: StrategicGap }) {
  const navigate = useNavigate();
  const config = SEVERITY_CONFIG[gap.severity];
  const Icon = config.icon;

  const handleClick = () => {
    if (gap.type === 'no_projects' || gap.type === 'no_kpis') {
      navigate(`/theses/${gap.relatedId}`);
    }
  };

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors hover:opacity-80",
        config.bg,
        config.border
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium", config.color)}>
              {config.label}
            </span>
          </div>
          <p className="text-sm font-medium mt-0.5">{gap.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{gap.message}</p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
}

export function StrategicGapsCard({ gaps }: StrategicGapsCardProps) {
  const criticalCount = gaps.filter(g => g.severity === 'critical').length;
  const warningCount = gaps.filter(g => g.severity === 'warning').length;

  if (gaps.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-green-600" />
            Alinhamento Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todas as teses estratégicas possuem projetos e KPIs definidos. 
            Excelente cobertura do portfólio!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Gaps Estratégicos
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {warningCount} atenção
              </span>
            )}
          </div>
        </div>
        <CardDescription>
          {gaps.length} {gaps.length === 1 ? 'gap identificado' : 'gaps identificados'} no portfólio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {gaps.slice(0, 5).map(gap => (
          <GapItem key={gap.id} gap={gap} />
        ))}
        {gaps.length > 5 && (
          <Button variant="ghost" className="w-full text-sm">
            Ver todos os {gaps.length} gaps
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
