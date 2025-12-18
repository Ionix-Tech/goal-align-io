import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, Link as LinkIcon, Trash2 } from "lucide-react";
import { useProjectSituations, useDeleteSituation } from "@/hooks/useProjectSituations";
import { AddSituationDialog } from "./AddSituationDialog";

interface SituationManagementProps {
  projectId: string;
}

export function SituationManagement({ projectId }: SituationManagementProps) {
  const { data: situations, isLoading } = useProjectSituations(projectId);
  const deleteSituation = useDeleteSituation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSituation, setEditingSituation] = useState<any>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Carregando situações...
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = async (situationId: string) => {
    if (confirm('Tem certeza que deseja remover esta situação?')) {
      await deleteSituation.mutateAsync({ situationId, projectId });
    }
  };

  const handleEdit = (situation: any) => {
    setEditingSituation(situation);
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingSituation(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Situação Atual vs Situação Alvo</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Mapeamento de problemas atuais e suas metas correspondentes
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Situação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!situations || situations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma situação mapeada ainda</p>
              <p className="text-sm mt-2">
                Clique em "Adicionar Situação" para mapear problemas e metas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {situations.map((situation, index) => (
                <Card key={situation.id} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {/* Number Badge */}
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                          {/* Current Problem */}
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              Situação Atual
                            </p>
                            <p className="text-sm">{situation.current_problem}</p>
                          </div>

                          {/* Arrow */}
                          <div className="flex justify-center">
                            <ArrowRight className="h-6 w-6 text-muted-foreground" />
                          </div>

                          {/* Target Goal */}
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                              Situação Alvo
                            </p>
                            <p className="text-sm">{situation.target_goal}</p>
                          </div>
                        </div>


                        {/* Attachments */}
                        {situation.attachments && situation.attachments.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              Anexos
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {situation.attachments.map((att: any) => (
                                <Badge key={att.id} variant="secondary" className="text-xs">
                                  📎 {att.file_name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Linked Tasks */}
                        {situation.linked_tasks && situation.linked_tasks.length > 0 && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {situation.linked_tasks.length} {situation.linked_tasks.length === 1 ? 'ação vinculada' : 'ações vinculadas'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(situation)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(situation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddSituationDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        projectId={projectId}
        editingSituation={editingSituation}
      />
    </>
  );
}
