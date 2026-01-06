import { Target, Loader2, Sparkles, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StrategicSuggestion {
  thesis_id: string;
  thesis_name: string;
  alignment_score: number;
  reason: string;
}

interface AIStrategicAlignmentCardProps {
  suggestions: StrategicSuggestion[];
  isLoading: boolean;
  selectedThesisId: string | null;
  onSuggest: () => void;
  onSelect: (thesisId: string) => void;
  onDismiss: () => void;
  disabled?: boolean;
}

export function AIStrategicAlignmentCard({
  suggestions,
  isLoading,
  selectedThesisId,
  onSuggest,
  onSelect,
  onDismiss,
  disabled,
}: AIStrategicAlignmentCardProps) {
  const getAlignmentColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    return "bg-muted-foreground";
  };

  if (isLoading) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Analisando alinhamento estratégico...</span>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSuggest}
          disabled={disabled}
          className="gap-2"
        >
          <Target className="h-4 w-4" />
          Sugerir alinhamento estratégico
        </Button>
        <span className="text-xs text-muted-foreground">
          IA sugere objetivos estratégicos relacionados
        </span>
      </div>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Alinhamento Estratégico Sugerido
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          A IA identificou objetivos estratégicos que podem se beneficiar desta ideia. Selecione um para vincular.
        </p>
        <div className="space-y-2">
          {suggestions.map((suggestion) => {
            const isSelected = selectedThesisId === suggestion.thesis_id;
            return (
              <TooltipProvider key={suggestion.thesis_id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onSelect(suggestion.thesis_id)}
                      className={`w-full flex items-start justify-between gap-3 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "bg-background hover:border-primary/50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {suggestion.thesis_name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-1 ${getAlignmentColor(
                                suggestion.alignment_score
                              )}`}
                            />
                            {suggestion.alignment_score}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {suggestion.reason}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-sm">{suggestion.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        {selectedThesisId && (
          <p className="text-xs text-primary flex items-center gap-1">
            <Check className="h-3 w-3" />
            Objetivo selecionado será vinculado ao criar a ideia
          </p>
        )}
      </CardContent>
    </Card>
  );
}