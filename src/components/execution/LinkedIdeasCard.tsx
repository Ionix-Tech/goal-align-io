import { useState } from 'react';
import { Lightbulb, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProjectSourceIdeas, useUnlinkIdeaFromProject } from '@/hooks/useProjectSourceIdeas';
import { useUserRole } from '@/hooks/useUserRole';
import { LinkIdeaDialog } from './LinkIdeaDialog';

interface LinkedIdeasCardProps {
  projectId: string;
}

export function LinkedIdeasCard({ projectId }: LinkedIdeasCardProps) {
  const { data: linkedIdeas, isLoading } = useProjectSourceIdeas(projectId);
  const { role } = useUserRole();
  const unlinkMutation = useUnlinkIdeaFromProject();
  
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [unlinkConfirmId, setUnlinkConfirmId] = useState<string | null>(null);

  const canUnlink = role === 'ceo' || role === 'pmo_manager';

  const handleUnlink = async () => {
    if (!unlinkConfirmId) return;
    await unlinkMutation.mutateAsync({ linkId: unlinkConfirmId, projectId });
    setUnlinkConfirmId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Ideias de Origem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Ideias de Origem
              </CardTitle>
              <CardDescription>
                Ideias do banco que inspiraram ou foram incorporadas a este projeto
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowLinkDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Vincular Ideia
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!linkedIdeas || linkedIdeas.length === 0 ? (
            <div className="text-center py-6">
              <Lightbulb className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma ideia vinculada a este projeto ainda.
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowLinkDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Vincular Primeira Ideia
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {linkedIdeas.map((link, index) => (
                <div key={link.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{link.idea.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          Ideia
                        </Badge>
                      </div>
                      {link.idea.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {link.idea.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>
                          Criada por: {link.idea.created_by_profile?.full_name || 'N/A'}
                        </span>
                        <span>•</span>
                        <span>
                          Vinculada em: {new Date(link.added_at).toLocaleDateString('pt-BR')}
                        </span>
                        {link.added_by_profile && (
                          <>
                            <span>•</span>
                            <span>Por: {link.added_by_profile.full_name}</span>
                          </>
                        )}
                      </div>
                      {link.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          "{link.notes}"
                        </p>
                      )}
                    </div>
                    {canUnlink && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setUnlinkConfirmId(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LinkIdeaDialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        projectId={projectId}
      />

      <AlertDialog open={!!unlinkConfirmId} onOpenChange={() => setUnlinkConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo?</AlertDialogTitle>
            <AlertDialogDescription>
              A ideia será desvinculada deste projeto e voltará a aparecer no banco de ideias disponíveis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink}>
              Remover Vínculo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
