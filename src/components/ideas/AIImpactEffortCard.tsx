import { Target, Zap, Loader2, Sparkles, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ImpactEffortEvaluation {
  impact_score: number;
  effort_score: number;
  impact_reason: string;
  effort_reason: string;
  summary: string;
}

interface AIImpactEffortCardProps {
  evaluation: ImpactEffortEvaluation | null;
  isLoading: boolean;
  onEvaluate: () => void;
  onDismiss: () => void;
  disabled?: boolean;
}

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Muito Baixo', color: 'text-muted-foreground' },
  2: { label: 'Baixo', color: 'text-blue-500' },
  3: { label: 'Médio', color: 'text-yellow-500' },
  4: { label: 'Alto', color: 'text-orange-500' },
  5: { label: 'Muito Alto', color: 'text-red-500' },
};

const getScoreInfo = (score: number) => {
  return SCORE_LABELS[score] || SCORE_LABELS[3];
};

const getImpactBarColor = (score: number) => {
  if (score >= 4) return 'bg-green-500';
  if (score >= 3) return 'bg-yellow-500';
  return 'bg-muted-foreground';
};

const getEffortBarColor = (score: number) => {
  if (score <= 2) return 'bg-green-500';
  if (score <= 3) return 'bg-yellow-500';
  return 'bg-orange-500';
};

function CustomProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div 
        className={cn("h-full transition-all", colorClass)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function AIImpactEffortCard({
  evaluation,
  isLoading,
  onEvaluate,
  onDismiss,
  disabled = false,
}: AIImpactEffortCardProps) {
  if (isLoading) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="py-6 flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Avaliando impacto e esforço...</span>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onEvaluate}
        disabled={disabled}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Avaliar Impacto/Esforço com IA
      </Button>
    );
  }

  const impactInfo = getScoreInfo(evaluation.impact_score);
  const effortInfo = getScoreInfo(evaluation.effort_score);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Avaliação IA
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Impact Score */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-2 cursor-help">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4 text-green-500" />
                    Impacto
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <CustomProgressBar 
                    value={evaluation.impact_score * 20} 
                    colorClass={getImpactBarColor(evaluation.impact_score)}
                  />
                  <p className={cn("text-sm font-medium", impactInfo.color)}>
                    {impactInfo.label} ({evaluation.impact_score}/5)
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{evaluation.impact_reason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Effort Score */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-2 cursor-help">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="h-4 w-4 text-orange-500" />
                    Esforço
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <CustomProgressBar 
                    value={evaluation.effort_score * 20} 
                    colorClass={getEffortBarColor(evaluation.effort_score)}
                  />
                  <p className={cn("text-sm font-medium", effortInfo.color)}>
                    {effortInfo.label} ({evaluation.effort_score}/5)
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{evaluation.effort_reason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Summary */}
        {evaluation.summary && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {evaluation.summary}
            </p>
          </div>
        )}

        {/* Quick Assessment Badge */}
        <div className="flex justify-center pt-1">
          <QuickAssessmentBadge 
            impact={evaluation.impact_score} 
            effort={evaluation.effort_score} 
          />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAssessmentBadge({ impact, effort }: { impact: number; effort: number }) {
  let label = '';
  let className = '';

  if (impact >= 4 && effort <= 2) {
    label = '⭐ Quick Win - Alta prioridade';
    className = 'bg-green-100 text-green-700 border-green-200';
  } else if (impact >= 4 && effort >= 4) {
    label = '🎯 Projeto Estratégico';
    className = 'bg-blue-100 text-blue-700 border-blue-200';
  } else if (impact <= 2 && effort <= 2) {
    label = '📋 Tarefa Simples';
    className = 'bg-gray-100 text-gray-700 border-gray-200';
  } else if (impact <= 2 && effort >= 4) {
    label = '⚠️ Reconsiderar viabilidade';
    className = 'bg-yellow-100 text-yellow-700 border-yellow-200';
  } else {
    label = '📊 Avaliar na priorização';
    className = 'bg-purple-100 text-purple-700 border-purple-200';
  }

  return (
    <span className={cn(
      "text-xs px-3 py-1 rounded-full border font-medium",
      className
    )}>
      {label}
    </span>
  );
}
