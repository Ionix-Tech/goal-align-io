import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send } from "lucide-react";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface ProjectCommentsProps {
  comments: Comment[];
  canComment: boolean;
  newComment: string;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
  isSubmitting?: boolean;
}

export function ProjectComments({
  comments,
  canComment,
  newComment,
  onCommentChange,
  onAddComment,
  isSubmitting = false
}: ProjectCommentsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-base font-semibold">
          Comentários ({comments.length})
        </h3>
      </div>

      {/* Lista de comentários */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div key={comment.id}>
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.user.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.user.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              </div>
              {index < comments.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum comentário ainda
        </p>
      )}

      {/* Novo comentário */}
      {canComment && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="new-comment" className="text-sm font-medium">
              Adicionar comentário
            </Label>
            <Textarea
              id="new-comment"
              placeholder="Escreva seu comentário..."
              value={newComment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={onAddComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Enviando..." : "Adicionar Comentário"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
