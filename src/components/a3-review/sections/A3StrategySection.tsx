import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { A3Requirement } from "@/hooks/useA3ReviewData";
import { Rocket, Target, ArrowRight } from "lucide-react";

interface A3StrategySectionProps {
  description: string | null;
  requirements: A3Requirement[];
}

export function A3StrategySection({ description, requirements }: A3StrategySectionProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Estratégia - Situação Alvo
          </CardTitle>
          <CardDescription>
            Onde queremos chegar ao final dos 90 dias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Descrição da Situação Alvo
            </label>
            <div className="bg-success/10 border border-success/20 p-4 rounded-lg min-h-[100px]">
              {description ? (
                <p className="text-foreground whitespace-pre-wrap">{description}</p>
              ) : (
                <p className="text-muted-foreground italic">Nenhuma descrição fornecida.</p>
              )}
            </div>
          </div>

          {/* Requirements to be met */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Requisitos a serem atendidos
            </label>
            
            {requirements.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {requirements.map((req) => (
                  <div 
                    key={req.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20"
                  >
                    <Badge variant="outline" className="shrink-0 font-mono text-xs">
                      {req.code}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-sm text-foreground">{req.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic py-4 text-center border rounded-lg">
                Nenhum requisito definido.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
