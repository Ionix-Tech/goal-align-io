import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Target, FileCheck, AlertCircle, TrendingUp, BarChart3, Compass, Plus, Pencil } from "lucide-react";
import type { ProjectDetails } from "@/hooks/useProjectDetails";
import type { ProjectRequirement } from "@/hooks/useRequirements";

interface ProjectCoverSectionProps {
  project: ProjectDetails;
  requirements: ProjectRequirement[];
  situations: Array<{
    id: string;
    current_problem: string;
    target_goal: string;
    indicators?: Array<{
      id: string;
      name: string;
      current_value: number;
      target_value: number;
      unit: string | null;
    }>;
  }>;
  thesis?: {
    id: string;
    name: string;
    objective: string;
  } | null;
  linkedKPI?: {
    id: string;
    name: string;
    current_value: number | null;
    target_value: number;
    unit: string | null;
  } | null;
  onAddRequirement?: () => void;
  onEditRequirements?: () => void;
}

export function ProjectCoverSection({ 
  project, 
  requirements, 
  situations,
  thesis,
  linkedKPI,
  onAddRequirement,
  onEditRequirements
}: ProjectCoverSectionProps) {
  return (
    <div className="space-y-6">
      {/* Objetivo do Projeto */}
      {project.objective && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {project.objective}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Requisitos - Tabela Compacta */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-4 w-4 text-primary" />
              Requisitos
            </CardTitle>
            <div className="flex items-center gap-2">
              {requirements.length > 0 && onEditRequirements && (
                <Button variant="ghost" size="sm" onClick={onEditRequirements}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              )}
              {onAddRequirement && (
                <Button variant="outline" size="sm" onClick={onAddRequirement}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requirements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Código</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Indicador</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((req) => (
                    <tr key={req.id} className="border-b last:border-0">
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {req.code}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {req.description}
                      </td>
                      <td className="py-2 px-2">
                        {req.indicator_name && (
                          <span className="text-xs text-muted-foreground">
                            {req.indicator_name}: {req.current_value ?? '—'} → {req.target_value} {req.unit}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum requisito cadastrado ainda.
              </p>
              {onAddRequirement && (
                <Button variant="outline" size="sm" onClick={onAddRequirement}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Requisito
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objetivo Estratégico */}
      {(thesis || project.strategic_indicator) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-4 w-4 text-primary" />
              Objetivo Estratégico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {thesis && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Tese Vinculada</span>
                </div>
                <p className="text-sm font-medium">{thesis.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{thesis.objective}</p>
              </div>
            )}
            
            {project.strategic_indicator && linkedKPI && (
              <>
                {thesis && <Separator />}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Indicador Macro Vinculado</span>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-medium mb-2">{linkedKPI.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Atual: {linkedKPI.current_value ?? '—'} {linkedKPI.unit}
                      </span>
                      <span className="text-xs text-muted-foreground">|</span>
                      <span className="text-xs text-muted-foreground">
                        Meta: {linkedKPI.target_value} {linkedKPI.unit}
                      </span>
                    </div>
                    {(() => {
                      const progress = linkedKPI.current_value && linkedKPI.target_value 
                        ? Math.min(100, (linkedKPI.current_value / linkedKPI.target_value) * 100)
                        : 0;
                      return (
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={progress} className="flex-1 h-2" />
                          <span className="text-xs font-medium w-10 text-right">{Math.round(progress)}%</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}

            {project.strategic_indicator && !linkedKPI && (
              <>
                {thesis && <Separator />}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Indicador Macro</span>
                  </div>
                  <p className="text-sm">{project.strategic_indicator}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Situação Atual vs Futura */}
      {situations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-primary" />
              Situação Atual vs Situação Alvo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {situations.map((situation, index) => (
                <div key={situation.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Situação Atual */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <h4 className="font-medium text-xs text-muted-foreground">Situação Atual</h4>
                      </div>
                      <p className="text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
                        {situation.current_problem}
                      </p>
                    </div>

                    {/* Situação Alvo */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <h4 className="font-medium text-xs text-muted-foreground">Situação Alvo</h4>
                      </div>
                      <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-900/30">
                        {situation.target_goal}
                      </p>
                    </div>
                  </div>

                  {/* Indicadores da situação */}
                  {situation.indicators && situation.indicators.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {situation.indicators.map((ind) => (
                        <Badge key={ind.id} variant="secondary" className="text-xs">
                          {ind.name}: {ind.current_value} → {ind.target_value} {ind.unit}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicadores do Projeto */}
      {project.indicators.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Indicadores do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.indicators.map(indicator => {
                const progress = indicator.progress ?? 0;
                return (
                  <div key={indicator.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{indicator.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {indicator.current_state} → {indicator.target_state} {indicator.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-10 text-right">{progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
