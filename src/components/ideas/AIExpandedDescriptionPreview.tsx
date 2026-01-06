import { Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIExpandedDescriptionPreviewProps {
  expandedDescription: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export function AIExpandedDescriptionPreview({
  expandedDescription,
  onAccept,
  onDismiss,
}: AIExpandedDescriptionPreviewProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Descrição expandida pela IA
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <ScrollArea className="h-[180px] rounded-md border bg-background p-3">
          <p className="text-sm whitespace-pre-wrap">{expandedDescription}</p>
        </ScrollArea>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={onAccept}
        >
          <Check className="h-4 w-4" />
          Usar esta descrição
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          Descartar
        </Button>
      </CardFooter>
    </Card>
  );
}
