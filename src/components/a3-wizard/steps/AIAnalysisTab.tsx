import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { useA3Analysis, AIAnalysisResult, SectionAnalysis } from "@/hooks/useA3Analysis";
import { 
  Sparkles, Star, CheckCircle2, AlertCircle, XCircle, 
  Lightbulb, ArrowRight, RefreshCw, AlertTriangle, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAnalysisTabProps {
  data: A3WizardData;
  goToStep: (step: number) => void;
}

const sectionToStep: Record<string, number> = {
  "Contexto": 1,
  "Requisitos": 2,
  "Situação Atual": 3,
  "Situação Alvo": 4,
  "Plano de Ação": 5,
  "Indicadores": 6,
  "Milestones": 6
};

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "w-5 h-5",
            i <= score ? "fill-warning text-warning" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: SectionAnalysis["status"] }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="w-5 h-5 text-success" />;
    case "partial":
      return <AlertCircle className="w-5 h-5 text-warning" />;
    case "missing":
      return <XCircle className="w-5 h-5 text-destructive" />;
  }
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const variants = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-muted text-muted-foreground"
  };
  const labels = { high: "Alta", medium: "Média", low: "Baixa" };
  
  return (
    <Badge variant="outline" className={cn("text-xs", variants[priority])}>
      {labels[priority]}
    </Badge>
  );
}

export function AIAnalysisTab({ data, goToStep }: AIAnalysisTabProps) {
  const { analyzeProject, isAnalyzing, analysis, error, reset } = useA3Analysis();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    setHasAnalyzed(true);
    await analyzeProject(data);
  };

  // Initial state - show analyze button
  if (!hasAnalyzed && !analysis) {
    return (
      <Card className="border-primary/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Análise Inteligente do A3</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Use inteligência artificial para analisar seu projeto A3, identificar gaps e receber 
            recomendações de melhoria antes de enviar para aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Button 
            onClick={handleAnalyze} 
            size="lg" 
            className="gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Analisar Projeto com IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            Analisando seu projeto...
          </CardTitle>
          <CardDescription>
            A IA está revisando todas as seções do seu A3. Isso pode levar alguns segundos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <div className="space-y-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !analysis) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Erro na Análise
          </CardTitle>
          <CardDescription>
            Não foi possível completar a análise do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleAnalyze} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results state
  if (analysis) {
    const highPriorityRecs = analysis.recommendations.filter(r => r.priority === "high");
    const mediumPriorityRecs = analysis.recommendations.filter(r => r.priority === "medium");
    const lowPriorityRecs = analysis.recommendations.filter(r => r.priority === "low");

    return (
      <div className="space-y-6">
        {/* Header with Score */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Resultado da Análise
                </CardTitle>
                <CardDescription>
                  Revisão completa do projeto por inteligência artificial
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Score Geral</div>
                <ScoreStars score={analysis.overallScore} />
                <div className="text-2xl font-bold mt-1">{analysis.overallScore}/5</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            <Button 
              onClick={handleAnalyze} 
              variant="outline" 
              size="sm" 
              className="mt-4 gap-2"
              disabled={isAnalyzing}
            >
              <RefreshCw className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
              Analisar Novamente
            </Button>
          </CardContent>
        </Card>

        {/* Critical Gaps Alert */}
        {analysis.criticalGaps.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Gaps Críticos Identificados</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {analysis.criticalGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Section Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise por Seção</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {analysis.sections.map((section, index) => (
                <AccordionItem 
                  key={index} 
                  value={section.name}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <StatusIcon status={section.status} />
                        <span className="font-medium">{section.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ScoreStars score={section.score} />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{section.feedback}</p>
                      
                      {section.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <Lightbulb className="w-4 h-4 text-warning" />
                            Sugestões:
                          </span>
                          <ul className="space-y-1">
                            {section.suggestions.map((suggestion, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <ArrowRight className="w-3 h-3 mt-1.5 shrink-0" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {sectionToStep[section.name] && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 gap-1"
                          onClick={() => goToStep(sectionToStep[section.name])}
                        >
                          Ir para Step {sectionToStep[section.name]}
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                Recomendações de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {highPriorityRecs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Prioridade Alta</h4>
                  {highPriorityRecs.map((rec, i) => (
                    <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-1">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority="high" />
                        <span className="text-sm font-medium">{rec.area}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <p className="text-sm flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium">{rec.action}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {mediumPriorityRecs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-warning">Prioridade Média</h4>
                  {mediumPriorityRecs.map((rec, i) => (
                    <div key={i} className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-1">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority="medium" />
                        <span className="text-sm font-medium">{rec.area}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <p className="text-sm flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium">{rec.action}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {lowPriorityRecs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Prioridade Baixa</h4>
                  {lowPriorityRecs.map((rec, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border space-y-1">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority="low" />
                        <span className="text-sm font-medium">{rec.area}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <p className="text-sm flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium">{rec.action}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <Card className="border-success/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-success">
                <Trophy className="w-5 h-5" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}
