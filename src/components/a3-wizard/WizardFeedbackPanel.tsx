import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface WizardComment {
  id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface WizardFeedbackPanelProps {
  comments: WizardComment[];
}

export function WizardFeedbackPanel({ comments }: WizardFeedbackPanelProps) {
  // Check if there are rejection comments (start with emoji or "Projeto devolvido")
  const hasRejectionComment = comments.some(c => 
    c.comment.includes("Projeto devolvido") || c.comment.startsWith("🔄")
  );
  
  const [isOpen, setIsOpen] = useState(hasRejectionComment);

  if (comments.length === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isRejectionComment = (comment: string) => {
    return comment.includes("Projeto devolvido") || comment.startsWith("🔄");
  };

  return (
    <Card className={hasRejectionComment ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20" : ""}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {hasRejectionComment ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={hasRejectionComment ? "text-amber-700 dark:text-amber-400" : ""}>
                  Feedback de Revisão
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({comments.length} {comments.length === 1 ? "comentário" : "comentários"})
                </span>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-lg ${
                  isRejectionComment(comment.comment)
                    ? "bg-amber-100/80 dark:bg-amber-900/30 border border-amber-300/50"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.user.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
