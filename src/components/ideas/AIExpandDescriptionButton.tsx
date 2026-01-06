import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIExpandDescriptionButtonProps {
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function AIExpandDescriptionButton({
  isLoading,
  disabled,
  onClick,
}: AIExpandDescriptionButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
            onClick={onClick}
            disabled={isLoading || disabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Expandindo...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Expandir com IA</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>A IA irá enriquecer sua descrição com contexto e estrutura</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
