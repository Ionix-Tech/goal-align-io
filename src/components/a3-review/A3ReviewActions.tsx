import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface A3ReviewActionsProps {
  projectId: string;
  projectName: string;
}

export function A3ReviewActions({ projectId, projectName }: A3ReviewActionsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleApprove = async () => {
    if (!user) return;
    
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', projectId);

      if (error) throw error;

      toast.success(`Projeto "${projectName}" aprovado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['a3-review-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/');
    } catch (error) {
      console.error('Error approving project:', error);
      toast.error('Erro ao aprovar projeto');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    setIsRejecting(true);
    try {
      // Move back to draft
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'draft',
          submitted_for_review_at: null
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      // Add comment with rejection reason
      if (user) {
        await supabase
          .from('project_comments')
          .insert({
            project_id: projectId,
            user_id: user.id,
            comment: `🔄 **Projeto devolvido para ajustes:**\n\n${rejectReason}`
          });
      }

      toast.success('Projeto devolvido para ajustes');
      queryClient.invalidateQueries({ queryKey: ['a3-review-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/');
    } catch (error) {
      console.error('Error rejecting project:', error);
      toast.error('Erro ao devolver projeto');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Ações de Aprovação
          </h3>

          {showRejectForm ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Descreva os ajustes necessários..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {isRejecting ? "Enviando..." : "Confirmar Devolução"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isApproving ? "Aprovando..." : "Aprovar Projeto"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                className="gap-2"
              >
                <XCircle className="w-4 h-4" />
                Solicitar Ajustes
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
