import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  target_date: string;
  completed: boolean;
  completed_at: string | null;
  progress?: number;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  onUpdateMilestone: (milestoneId: string) => void;
  onViewHistory: (milestoneId: string) => void;
  onViewDateHistory: (milestoneId: string) => void;
}

export function MilestoneTimeline({
  milestones,
  onUpdateMilestone,
  onViewHistory,
  onViewDateHistory
}: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p>Nenhum milestone definido para este projeto</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        const progress = milestone.progress || 0;
        const isCompleted = milestone.completed;
        const isOverdue = !isCompleted && new Date(milestone.target_date) < new Date();

        return (
          <div key={milestone.id} className="relative">
            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[19px] top-[40px] w-0.5 h-[calc(100%+1.5rem)] z-0",
                  isCompleted ? "bg-green-300" : "bg-gray-200"
                )}
              />
            )}

            {/* Milestone Card */}
            <Card className={cn(
              "relative z-10 transition-all",
              isCompleted && "bg-green-50/50",
              isOverdue && !isCompleted && "border-red-300 bg-red-50/50"
            )}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {isCompleted ? (
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    ) : (
                      <Circle className={cn(
                        "h-10 w-10",
                        isOverdue ? "text-red-500" : "text-gray-400"
                      )} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{milestone.title}</h3>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            Completo
                          </Badge>
                        )}
                        {isOverdue && !isCompleted && (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            Atrasado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Target Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Data alvo:</span>
                      <span className="font-medium">
                        {format(new Date(milestone.target_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      {isCompleted && milestone.completed_at && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Concluído em:</span>
                          <span className="font-medium text-green-700">
                            {format(new Date(milestone.completed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {!isCompleted && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onUpdateMilestone(milestone.id)}
                        disabled={isCompleted}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Atualizar Progresso
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewHistory(milestone.id)}
                      >
                        Ver Histórico
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDateHistory(milestone.id)}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Histórico de Datas
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
