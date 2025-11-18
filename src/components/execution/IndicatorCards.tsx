import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, Minus, Plus } from "lucide-react";

interface Indicator {
  id: string;
  name: string;
  current_state: string;
  target_state: string;
  unit?: string | null;
  progress?: number;
  trend?: 'up' | 'down' | 'stable';
  lastUpdate?: string | null;
}

interface IndicatorCardsProps {
  indicators: Indicator[];
  onUpdateIndicator: (indicatorId: string) => void;
  onViewHistory: (indicatorId: string) => void;
}

export function IndicatorCards({
  indicators,
  onUpdateIndicator,
  onViewHistory
}: IndicatorCardsProps) {
  if (indicators.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>Nenhum indicador definido para este projeto</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendBadge = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1">
            <ArrowUpRight className="h-3 w-3" />
            Crescendo
          </Badge>
        );
      case 'down':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 gap-1">
            <ArrowDownRight className="h-3 w-3" />
            Decrescendo
          </Badge>
        );
      case 'stable':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 gap-1">
            <Minus className="h-3 w-3" />
            Estável
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {indicators.map((indicator) => {
        const progress = indicator.progress || 0;

        return (
          <Card key={indicator.id} className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base font-semibold flex-1">
                  {indicator.name}
                </CardTitle>
                {getTrendBadge(indicator.trend)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current vs Target */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Marcação inicial</p>
                  <p className="text-lg font-bold text-primary">
                    {indicator.current_state}
                    {indicator.unit && <span className="text-sm ml-1">{indicator.unit}</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Meta</p>
                  <p className="text-lg font-bold">
                    {indicator.target_state}
                    {indicator.unit && <span className="text-sm ml-1">{indicator.unit}</span>}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Last Update */}
              {indicator.lastUpdate && (
                <p className="text-xs text-muted-foreground">
                  Última atualização: {indicator.lastUpdate}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onUpdateIndicator(indicator.id)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Medição
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewHistory(indicator.id)}
                >
                  Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
