import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { A3Indicator, A3Requirement } from "@/hooks/useA3ReviewData";
import { BarChart3, TrendingUp, ArrowRight } from "lucide-react";

interface A3ControlSectionProps {
  indicators: A3Indicator[];
  requirements: A3Requirement[];
}

export function A3ControlSection({ indicators, requirements }: A3ControlSectionProps) {
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
              {indicators.map((indicator) => (
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
                </div>
              ))}
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
