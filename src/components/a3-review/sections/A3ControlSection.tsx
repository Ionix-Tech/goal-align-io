import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { A3Indicator, A3Requirement, A3Task } from "@/hooks/useA3ReviewData";
import { BarChart3, TrendingUp, ClipboardList, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface A3ControlSectionProps {
  indicators: A3Indicator[];
  requirements: A3Requirement[];
  tasks: A3Task[];
}

export function A3ControlSection({ indicators, requirements, tasks }: A3ControlSectionProps) {
  // Get tasks that impact each indicator
  const getTasksForIndicator = (indicatorId: string) => {
    return tasks.filter(t => t.linkedIndicatorIds.includes(indicatorId));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Indicadores de Controle
          </CardTitle>
          <CardDescription>
            Como vamos medir o sucesso do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {indicators.length > 0 ? (
            <div className="space-y-4">
              {indicators.map((indicator) => {
                const impactingTasks = getTasksForIndicator(indicator.id);
                
                return (
                  <div 
                    key={indicator.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          {indicator.name}
                        </h4>
                        {indicator.unit && (
                          <p className="text-sm text-muted-foreground">
                            Unidade: {indicator.unit}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Current vs Target */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Valor Atual</p>
                        <p className="font-semibold text-lg">
                          {indicator.current_state}
                          {indicator.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{indicator.unit}</span>}
                        </p>
                      </div>
                      <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Meta (90 dias)</p>
                        <p className="font-semibold text-lg text-success">
                          {indicator.target_state}
                          {indicator.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{indicator.unit}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Linked Requirements */}
                    {indicator.linkedRequirements.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Requisitos vinculados:</p>
                        <div className="flex flex-wrap gap-2">
                          {indicator.linkedRequirements.map((code) => (
                            <Badge key={code} variant="secondary" className="font-mono text-xs">
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks that impact this indicator */}
                    {impactingTasks.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" />
                          Ações que impactam este indicador:
                        </p>
                        <div className="space-y-2">
                          {impactingTasks.map((task) => (
                            <div key={task.id} className="text-sm flex items-center gap-2 text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              <span className="font-medium text-foreground">{task.title}</span>
                              {task.assigneeName && (
                                <span className="flex items-center gap-1 text-xs">
                                  <User className="w-3 h-3" />
                                  {task.assigneeName}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-xs">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(task.dueDate), "dd/MM")}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum indicador de controle definido.
            </p>
          )}

          {/* Summary */}
          {indicators.length > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total: <span className="font-medium">{indicators.length}</span> indicador{indicators.length !== 1 ? 'es' : ''}
              </span>
              <span className="text-muted-foreground">
                Requisitos: <span className="font-medium">{requirements.length}</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
