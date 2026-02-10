import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useA3Copilot } from "@/hooks/useA3Copilot";
import { A3WizardData, WizardAction } from "@/hooks/useA3WizardState";
import { 
  Sparkles, ChevronDown, ChevronUp, Send, 
  Lightbulb, FileText, Target, Search, 
  ClipboardList, Shield, AlertCircle, CheckCircle,
  Wand2, MessageCircle, X, Bot, Trash2, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface AICopilotPanelProps {
  currentStep: number;
  data: A3WizardData;
  onApplySuggestion: (field: string, value: any) => void;
  onApplyRequirements: (requirements: { description: string }[]) => void;
  onApplyActions: (actions: { description: string; linkedRequirements: string[] }[]) => void;
}

const stepIcons: Record<number, React.ReactNode> = {
  1: <FileText className="w-4 h-4" />,
  2: <Target className="w-4 h-4" />,
  3: <Search className="w-4 h-4" />,
  4: <Lightbulb className="w-4 h-4" />,
  5: <ClipboardList className="w-4 h-4" />,
  6: <Shield className="w-4 h-4" />,
  7: <CheckCircle className="w-4 h-4" />
};

const stepNames: Record<number, string> = {
  1: "Contexto",
  2: "Requisitos",
  3: "Situação Atual",
  4: "Situação Alvo",
  5: "Plano de Ação",
  6: "Controle",
  7: "Revisão"
};

export function AICopilotPanel({
  currentStep,
  data,
  onApplySuggestion,
  onApplyRequirements,
  onApplyActions,
}: AICopilotPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [isGuidanceExpanded, setIsGuidanceExpanded] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [currentTip, setCurrentTip] = useState<string | null>(null);
  
  const {
    isLoading,
    guidance,
    error,
    getGuidance,
    suggestName,
    expandObjective,
    generateRequirements,
    expandCurrentSituation,
    generateTargetSituation,
    suggestActions,
    askQuestion,
    reset
  } = useA3Copilot();

  // Load guidance and clear chat when step changes
  useEffect(() => {
    if (!isCollapsed) {
      getGuidance(currentStep, data);
    }
    // Clear chat and tips when step changes
    setChatMessages([]);
    setCurrentTip(null);
    setExpandedMessages(new Set());
  }, [currentStep, isCollapsed]);

  const handleSuggestName = async () => {
    if (!data.objective?.trim()) {
      toast.error("Preencha o objetivo primeiro para sugerir nomes.");
      return;
    }
    const suggestions = await suggestName(data.objective, data);
    if (suggestions.length > 0) {
      setNameSuggestions(suggestions);
      toast.success("Sugestões de nome geradas!");
    }
  };

  const handleApplyName = (name: string) => {
    onApplySuggestion("name", name);
    setNameSuggestions([]);
    toast.success("Nome aplicado!");
  };

  // State for pending objective suggestion (2.1 - show preview before applying)
  const [pendingObjectiveSuggestion, setPendingObjectiveSuggestion] = useState<string | null>(null);

  const handleExpandObjective = async () => {
    if (!data.objective?.trim()) {
      toast.error("Preencha o objetivo primeiro.");
      return;
    }
    const expanded = await expandObjective(data.objective, data);
    if (expanded) {
      // Show preview instead of applying directly
      setPendingObjectiveSuggestion(expanded);
      toast.success("Sugestão de objetivo gerada!");
    }
  };

  const handleApplyObjective = () => {
    if (pendingObjectiveSuggestion) {
      onApplySuggestion("objective", pendingObjectiveSuggestion);
      setPendingObjectiveSuggestion(null);
      toast.success("Objetivo atualizado!");
    }
  };

  const handleRejectObjective = () => {
    setPendingObjectiveSuggestion(null);
    toast.info("Objetivo original mantido");
  };

  const handleGenerateRequirements = async () => {
    if (!data.objective?.trim()) {
      toast.error("Preencha o objetivo primeiro.");
      return;
    }
    const requirements = await generateRequirements(data);
    if (requirements.length > 0) {
      onApplyRequirements(requirements);
      toast.success(`${requirements.length} requisitos gerados!`);
    }
  };

  const handleExpandCurrentSituation = async () => {
    const expanded = await expandCurrentSituation(data.currentSituationDescription || "", data);
    if (expanded) {
      onApplySuggestion("currentSituationDescription", expanded);
      toast.success("Situação atual expandida!");
    }
  };

  const handleGenerateTargetSituation = async () => {
    if (!data.currentSituationDescription?.trim()) {
      toast.error("Preencha a situação atual primeiro.");
      return;
    }
    const target = await generateTargetSituation(data);
    if (target) {
      onApplySuggestion("targetSituationDescription", target);
      toast.success("Situação alvo gerada!");
    }
  };

  const handleSuggestActions = async () => {
    if (data.requirements.length === 0) {
      toast.error("Defina requisitos primeiro.");
      return;
    }
    const actions = await suggestActions(data);
    if (actions.length > 0) {
      onApplyActions(actions);
      toast.success(`${actions.length} ações sugeridas!`);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    const userMessage = question;
    setQuestion("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    const answer = await askQuestion(userMessage, currentStep, data);
    if (answer) {
      setChatMessages(prev => [...prev, { role: "assistant", content: answer }]);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setExpandedMessages(new Set());
  };

  const toggleMessageExpand = (index: number) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleShowTip = (tip: string) => {
    setCurrentTip(tip);
  };

  const handleCloseTip = () => {
    setCurrentTip(null);
  };

  const getQuickActions = () => {
    switch (currentStep) {
      case 1:
        return [
          { label: "Refinar Objetivo", action: handleExpandObjective, icon: <Lightbulb className="w-4 h-4" />, isTip: false },
          { label: "Sugerir Nome", action: handleSuggestName, icon: <Wand2 className="w-4 h-4" />, isTip: false }
        ];
      case 2:
        return [
          { 
            label: "Perguntas Chave", 
            action: () => handleShowTip(
              "🤔 Para definir seus requisitos, reflita:\n\n• O que seria um DESASTRE se não acontecesse?\n• Como seu cliente vai perceber o sucesso?\n• Que métrica você quer mover?"
            ), 
            icon: <MessageCircle className="w-4 h-4" />,
            isTip: true
          },
          { 
            label: "Ver Exemplo", 
            action: () => handleShowTip(
              "📌 Exemplo de bom requisito:\n\n\"Reduzir tempo de atendimento de 15min para 8min até março\"\n\n✓ Mensurável\n✓ Específico\n✓ Com prazo"
            ), 
            icon: <FileText className="w-4 h-4" />,
            isTip: true
          }
        ];
      case 3:
        return [
          { 
            label: "Perguntas para Descrever", 
            action: () => handleShowTip(
              "🔍 Para descrever a situação atual:\n\n• Se alguém de fora olhasse, o que veria?\n• Que dados comprovam o problema?\n• Há quanto tempo isso acontece?"
            ), 
            icon: <MessageCircle className="w-4 h-4" />,
            isTip: true
          },
          { 
            label: "Ver Exemplo", 
            action: () => handleShowTip(
              "📌 Exemplo:\n\n\"Tempo de atendimento: 15 min. 60% reclamam da demora. NPS: 6.2 (meta: 8.0).\""
            ), 
            icon: <FileText className="w-4 h-4" />,
            isTip: true
          }
        ];
      case 4:
        return [
          { 
            label: "Perguntas para Visualizar", 
            action: () => handleShowTip(
              "🎯 Para definir a situação alvo:\n\n• Como será o dia seguinte quando terminar?\n• Que números vão provar sucesso?\n• O que o cliente vai perceber?"
            ), 
            icon: <MessageCircle className="w-4 h-4" />,
            isTip: true
          },
          { 
            label: "Ver Exemplo", 
            action: () => handleShowTip(
              "📌 Exemplo:\n\n\"Tempo de atendimento: 8 min. NPS > 8.0. Reclamações -70%.\""
            ), 
            icon: <FileText className="w-4 h-4" />,
            isTip: true
          }
        ];
      case 5:
        return [
          { 
            label: "Perguntas para Planejar", 
            action: () => handleShowTip(
              "📋 Para cada requisito:\n\n• Qual a PRIMEIRA ação?\n• Quem vai liderar?\n• Em quantos dias a primeira entrega?"
            ), 
            icon: <MessageCircle className="w-4 h-4" />,
            isTip: true
          }
        ];
      case 6:
        return [
          {
            label: "Ver Exemplo",
            action: () => handleShowTip(
              "📌 Exemplo de indicador:\n\nNome: Tempo Médio de Atendimento\nAtual: 15 min | Meta: 8 min"
            ),
            icon: <FileText className="w-4 h-4" />,
            isTip: true
          }
        ];
      case 7:
        return [
          { 
            label: "Checklist Final", 
            action: () => handleShowTip(
              "✅ Revise seu A3:\n\n• Objetivo claro e mensurável?\n• Requisitos têm indicadores?\n• Ações cobrem requisitos?\n• Alguém de fora entenderia?"
            ), 
            icon: <CheckCircle className="w-4 h-4" />,
            isTip: true
          }
        ];
      default:
        return [];
    }
  };

  const getStepWarnings = () => {
    const warnings: string[] = [];
    
    switch (currentStep) {
      case 1:
        if (!data.name?.trim()) warnings.push("Nome do projeto não definido");
        if (!data.objective?.trim()) warnings.push("Objetivo não preenchido");
        if (!data.thesisId) warnings.push("Tese estratégica não vinculada");
        break;
      case 2:
        if (data.requirements.length === 0) warnings.push("Nenhum requisito definido");
        const emptyReqs = data.requirements.filter(r => !r.description?.trim());
        if (emptyReqs.length > 0) warnings.push(`${emptyReqs.length} requisito(s) sem descrição`);
        break;
      case 3:
        if (!data.currentSituationDescription?.trim()) warnings.push("Situação atual não descrita");
        break;
      case 4:
        if (!data.targetSituationDescription?.trim()) warnings.push("Situação alvo não descrita");
        break;
      case 5:
        if (data.actions.length === 0) warnings.push("Nenhuma ação definida");
        const unlinkedActions = data.actions.filter(a => a.linkedRequirements.length === 0);
        if (unlinkedActions.length > 0) warnings.push(`${unlinkedActions.length} ação(ões) sem vínculo com requisitos`);
        break;
      case 6:
        if (!data.m1Date) warnings.push("Data M1 não definida");
        if (data.indicators.length === 0) warnings.push("Nenhum indicador definido");
        break;
    }
    
    return warnings;
  };

  const quickActions = getQuickActions();
  const warnings = getStepWarnings();

  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-4 right-4 gap-2 shadow-lg z-50"
      >
        <Sparkles className="w-4 h-4 text-yellow-500" />
        Assistente IA
      </Button>
    );
  }

  return (
    <Card className="w-80 flex-shrink-0 sticky top-4 border-primary/20 bg-card/50 backdrop-blur h-[calc(100vh-2rem)] flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Assistente A3</CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stepIcons[currentStep]}
                <span>{stepNames[currentStep]}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCollapsed(true)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
        {/* Scrollable Content Area */}
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {/* Guidance Message */}
            <div className="space-y-2">
              {isLoading && !guidance ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : guidance ? (
                <div className="space-y-2">
                  <p className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words ${
                    !isGuidanceExpanded ? "line-clamp-4" : ""
                  }`}>
                    {guidance}
                  </p>
                  {guidance.length > 200 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={() => setIsGuidanceExpanded(!isGuidanceExpanded)}
                    >
                      {isGuidanceExpanded ? "Ver menos" : "Ver mais"}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-1">
                {warnings.map((warning, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Name Suggestions */}
            {nameSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Sugestões de Nome:</p>
                {nameSuggestions.map((name, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 text-xs"
                    onClick={() => handleApplyName(name)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            )}

            {/* Pending Objective Suggestion (2.1 fix) */}
            {pendingObjectiveSuggestion && (
              <div className="relative bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-primary mb-1">Sugestão de Objetivo:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {pendingObjectiveSuggestion}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleApplyObjective}
                    className="flex-1 gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Usar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectObjective}
                    className="flex-1 gap-1"
                  >
                    <X className="w-3 h-3" />
                    Manter Original
                  </Button>
                </div>
              </div>
            )}

            {/* Current Tip */}
            {currentTip && (
              <div className="relative bg-primary/5 border border-primary/20 rounded-lg p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-5 w-5"
                  onClick={handleCloseTip}
                >
                  <X className="w-3 h-3" />
                </Button>
                <p className="text-sm text-foreground whitespace-pre-wrap pr-4">
                  {currentTip}
                </p>
              </div>
            )}

            {/* Quick Actions - Reorganized as stacked buttons */}
            {quickActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Ações Rápidas:</p>
                <div className="flex flex-col gap-2">
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start gap-2 h-9"
                      onClick={action.action}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        action.icon
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <Collapsible open={isChatOpen} onOpenChange={setIsChatOpen}>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MessageCircle className="w-3 h-3" />
                    Conversa ({chatMessages.length})
                    {isChatOpen ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleClearChat}
                    title="Limpar conversa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {chatMessages.map((msg, i) => {
                      const isExpanded = expandedMessages.has(i);
                      const isLong = msg.content.length > 300;
                      
                      return (
                        <div
                          key={i}
                          className={`text-xs p-2 rounded whitespace-pre-wrap break-words ${
                            msg.role === "user" 
                              ? "bg-primary/10 ml-4" 
                              : "bg-muted mr-4"
                          }`}
                        >
                          <div className={!isExpanded && isLong ? "line-clamp-6" : ""}>
                            {msg.content}
                          </div>
                          {isLong && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 mt-1 text-xs text-primary"
                              onClick={() => toggleMessageExpand(i)}
                            >
                              {isExpanded ? "Ver menos" : "Ver mais"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        {/* Fixed Question Input at Bottom */}
        <div className="flex-shrink-0 pt-4 border-t mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Faça uma pergunta..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
              className="text-xs h-9"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={handleAskQuestion}
              disabled={isLoading || !question.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
