import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Loader2 } from "lucide-react";
import type { WorkloadData } from "@/hooks/useWorkloadData";
import type { ProjectLeadershipData } from "@/hooks/useProjectLeadershipData";

interface WorkloadAIInsightsProps {
  workloadData: WorkloadData | undefined;
  leadershipData: ProjectLeadershipData | undefined;
}

interface Insight {
  id: string;
  type: "warning" | "info" | "critical";
  message: string;
  details?: string;
}

export function WorkloadAIInsights({ workloadData, leadershipData }: WorkloadAIInsightsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  // Generate automatic client-side insights
  const insights = useMemo((): Insight[] => {
    const results: Insight[] = [];

    if (workloadData) {
      const overloadedMembers = workloadData.members.filter(
        (m) => m.workloadLevel === "overloaded"
      );
      if (overloadedMembers.length > 0) {
        results.push({
          id: "overloaded-members",
          type: "critical",
          message: `${overloadedMembers.length} membro(s) estão sobrecarregados`,
          details: overloadedMembers.map((m) => m.memberName).join(", "),
        });
      }

      if (workloadData.unassignedTasks > 5) {
        results.push({
          id: "unassigned-tasks",
          type: "warning",
          message: `${workloadData.unassignedTasks} tarefas estão sem responsável`,
        });
      }

      if (workloadData.overdueTasks > 0) {
        results.push({
          id: "overdue-tasks",
          type: "warning",
          message: `${workloadData.overdueTasks} tarefas estão atrasadas`,
        });
      }
    }

    if (leadershipData) {
      const overloadedLeaders = leadershipData.leaders.filter(
        (l) => l.leadershipLevel === "overloaded"
      );
      if (overloadedLeaders.length > 0) {
        results.push({
          id: "overloaded-leaders",
          type: "critical",
          message: `${overloadedLeaders.length} líder(es) com muitos projetos críticos`,
          details: overloadedLeaders.map((l) => `${l.leaderName} (${l.critical} críticos)`).join(", "),
        });
      }

      if (leadershipData.unassignedProjects > 0) {
        results.push({
          id: "unassigned-projects",
          type: "warning",
          message: `${leadershipData.unassignedProjects} projetos estão sem líder atribuído`,
        });
      }

      if (leadershipData.criticalProjects > 0) {
        results.push({
          id: "critical-projects",
          type: "critical",
          message: `${leadershipData.criticalProjects} projetos estão em situação crítica`,
        });
      }
    }

    if (results.length === 0) {
      results.push({
        id: "all-good",
        type: "info",
        message: "Tudo sob controle! Não há alertas no momento.",
      });
    }

    return results;
  }, [workloadData, leadershipData]);

  const handleAIAnalysis = async () => {
    if (!workloadData && !leadershipData) return;

    setIsAnalyzing(true);
    try {
      const context = {
        workload: workloadData ? {
          totalTasks: workloadData.totalTasks,
          unassignedTasks: workloadData.unassignedTasks,
          overdueTasks: workloadData.overdueTasks,
          overloadedMembers: workloadData.members
            .filter((m) => m.workloadLevel === "overloaded")
            .map((m) => ({ name: m.memberName, activeTasks: m.activeTasks, overdue: m.overdue })),
          highWorkloadMembers: workloadData.members
            .filter((m) => m.workloadLevel === "high")
            .map((m) => ({ name: m.memberName, activeTasks: m.activeTasks })),
        } : null,
        leadership: leadershipData ? {
          totalProjects: leadershipData.totalProjects,
          criticalProjects: leadershipData.criticalProjects,
          unassignedProjects: leadershipData.unassignedProjects,
          overloadedLeaders: leadershipData.leaders
            .filter((l) => l.leadershipLevel === "overloaded")
            .map((l) => ({ name: l.leaderName, totalProjects: l.totalProjects, critical: l.critical })),
        } : null,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/management-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              { role: "user", content: "Analise a carga de trabalho da equipe e sugira ações para equilibrar melhor a distribuição de tarefas e projetos. Seja objetivo e direto." }
            ],
            context: {
              type: "management",
              projects: [],
              workloadAnalysis: context,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao analisar");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      
      const decoder = new TextDecoder();
      let fullResponse = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              setAiInsights(fullResponse);
            }
          } catch {
            // Incomplete JSON, wait for more data
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (!fullResponse) {
        setAiInsights("Não foi possível gerar análise.");
      }
    } catch (error) {
      console.error("Error analyzing workload:", error);
      setAiInsights("Erro ao analisar carga de trabalho. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightBadge = (type: Insight["type"]) => {
    switch (type) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "warning":
        return <Badge variant="secondary">Atenção</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Insights de Carga</CardTitle>
                {insights.filter((i) => i.type === "critical").length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {insights.filter((i) => i.type === "critical").length}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3 mb-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{insight.message}</span>
                      {getInsightBadge(insight.type)}
                    </div>
                    {insight.details && (
                      <p className="text-xs text-muted-foreground">{insight.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {aiInsights && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Análise da IA</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {aiInsights}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAIAnalysis}
              disabled={isAnalyzing || (!workloadData && !leadershipData)}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Pedir análise para IA
                </>
              )}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
