import { useState } from 'react';
import { Search, Lightbulb, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAvailableIdeas, useLinkIdeasToProject } from '@/hooks/useProjectSourceIdeas';

interface LinkIdeaDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function LinkIdeaDialog({ open, onClose, projectId }: LinkIdeaDialogProps) {
  const { data: availableIdeas, isLoading } = useAvailableIdeas();
  const linkMutation = useLinkIdeasToProject();
  
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const filteredIdeas = (availableIdeas || []).filter(idea =>
    idea.name.toLowerCase().includes(search.toLowerCase()) ||
    (idea.description && idea.description.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLink = async () => {
    if (selectedIds.length === 0) return;
    
    await linkMutation.mutateAsync({
      projectId,
      ideaIds: selectedIds,
      notes: notes || undefined,
    });
    
    // Reset and close
    setSelectedIds([]);
    setNotes('');
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSelectedIds([]);
    setNotes('');
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Vincular Ideias
          </DialogTitle>
          <DialogDescription>
            Selecione uma ou mais ideias do banco para vincular a este projeto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ideias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Ideas List */}
          <div className="border rounded-lg">
            <ScrollArea className="h-[250px]">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando ideias...
                </div>
              ) : filteredIdeas.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {search ? 'Nenhuma ideia encontrada' : 'Não há ideias disponíveis no banco'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedIds.includes(idea.id) ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => toggleSelection(idea.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.includes(idea.id)}
                          onCheckedChange={() => toggleSelection(idea.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{idea.name}</p>
                          {idea.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {idea.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Por: {idea.created_by_profile?.full_name || 'N/A'} •{' '}
                            {idea.created_at
                              ? new Date(idea.created_at).toLocaleDateString('pt-BR')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} ideia(s) selecionada(s)
            </p>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Contexto ou motivo do vínculo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleLink}
            disabled={selectedIds.length === 0 || linkMutation.isPending}
          >
            {linkMutation.isPending ? 'Vinculando...' : `Vincular ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
