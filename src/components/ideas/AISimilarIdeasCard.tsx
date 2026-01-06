import { AlertTriangle, ExternalLink, Loader2, Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface SimilarIdea {
  id: string;
  name: string;
  similarity_score: number;
  reason: string;
}

interface AISimilarIdeasCardProps {
  similarIdeas: SimilarIdea[];
  isLoading: boolean;
  onSearch: () => void;
  onDismiss: () => void;
  disabled?: boolean;
}

export function AISimilarIdeasCard({
  similarIdeas,
  isLoading,
  onSearch,
  onDismiss,
  disabled,
}: AISimilarIdeasCardProps) {
  const navigate = useNavigate();

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "secondary";
    return "outline";
  };

  if (isLoading) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Buscando ideias similares...</span>
        </CardContent>
      </Card>
    );
  }

  if (similarIdeas.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSearch}
          disabled={disabled}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          Verificar duplicatas
        </Button>
        <span className="text-xs text-muted-foreground">
          IA verifica se já existe ideia similar
        </span>
      </div>
    );
  }

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Ideias Similares Encontradas
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
          A IA encontrou ideias existentes que podem ser relacionadas à sua. Considere revisar antes de criar uma nova.
        </p>
        <div className="space-y-2">
          {similarIdeas.map((idea) => (
            <div
              key={idea.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-background border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{idea.name}</span>
                  <Badge variant={getSimilarityColor(idea.similarity_score)} className="text-xs">
                    {idea.similarity_score}% similar
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {idea.reason}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/projects/${idea.id}`)}
                className="shrink-0 h-8 px-2"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          💡 Você ainda pode criar sua ideia se acredita que é diferente.
        </p>
      </CardContent>
    </Card>
  );
}