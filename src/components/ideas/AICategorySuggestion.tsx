import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PROJECT_CATEGORIES, ProjectCategory } from '@/config/categories';
import { cn } from '@/lib/utils';

interface AICategorySuggestionProps {
  suggestion: {
    category: string;
    confidence: number;
    reason: string;
  } | null;
  isLoading: boolean;
  onAccept: (category: ProjectCategory) => void;
  onDismiss: () => void;
}

export function AICategorySuggestion({
  suggestion,
  isLoading,
  onAccept,
  onDismiss,
}: AICategorySuggestionProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Analisando categoria...</span>
      </div>
    );
  }

  if (!suggestion) return null;

  const categoryConfig = PROJECT_CATEGORIES.find(c => c.value === suggestion.category);
  if (!categoryConfig) return null;

  const Icon = categoryConfig.icon;
  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="text-sm text-muted-foreground">Sugestão IA:</span>
      </div>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-7 gap-1.5 border-dashed hover:border-solid transition-all",
          categoryConfig.colorClass
        )}
        onClick={() => onAccept(suggestion.category as ProjectCategory)}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{categoryConfig.label}</span>
        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
          {confidencePercent}%
        </Badge>
        <Check className="h-3.5 w-3.5 ml-1" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      {suggestion.reason && (
        <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
          {suggestion.reason}
        </span>
      )}
    </div>
  );
}
