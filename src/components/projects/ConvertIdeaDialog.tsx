import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Lightbulb, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PROJECT_CATEGORIES, ProjectCategory } from '@/config/categories';
import { useAvailableIdeas, useLinkIdeasToProject } from '@/hooks/useProjectSourceIdeas';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ConvertIdeaDialogProps {
  open: boolean;
  onClose: () => void;
  idea: {
    id: string;
    name: string;
    description: string | null;
    category?: string | null;
  } | null;
}

export function ConvertIdeaDialog({ open, onClose, idea }: ConvertIdeaDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | "">(
    (idea?.category as ProjectCategory) || ""
  );
  
  // Multi-idea selection
  const [showRelatedIdeas, setShowRelatedIdeas] = useState(false);
  const [selectedRelatedIds, setSelectedRelatedIds] = useState<string[]>([]);
  const [ideaSearch, setIdeaSearch] = useState('');
  
  const { data: availableIdeas } = useAvailableIdeas(idea?.id);
  const linkMutation = useLinkIdeasToProject();

  const filteredIdeas = (availableIdeas || []).filter(i =>
    i.name.toLowerCase().includes(ideaSearch.toLowerCase()) ||
    (i.description && i.description.toLowerCase().includes(ideaSearch.toLowerCase()))
  );

  const toggleRelatedSelection = (id: string) => {
    setSelectedRelatedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const convertMutation = useMutation({
    mutationFn: async ({ category }: { category: ProjectCategory }) => {
      if (!idea || !user?.id) throw new Error('Missing data');

      // Create new project with source_idea_id
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: idea.name,
          description: idea.description,
          initiative_type: 'project',
          status: 'draft',
          source_idea_id: idea.id,
          created_by: user.id,
          category: category as any,
        })
        .select()
        .single();

      if (error) throw error;
      return { newProject: data };
    },
    onSuccess: async ({ newProject }) => {
      // Link the original idea AND any selected related ideas
      const ideaIdsToLink = [idea!.id, ...selectedRelatedIds];
      
      try {
        await linkMutation.mutateAsync({
          projectId: newProject.id,
          ideaIds: ideaIdsToLink,
          notes: ideaIdsToLink.length > 1 
            ? `Convertido com ${ideaIdsToLink.length} ideias vinculadas`
            : 'Ideia original convertida',
        });
      } catch (err) {
        console.error('Error linking ideas:', err);
        // Don't fail the conversion, just log
      }

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['available-ideas'] });
      
      const extraText = selectedRelatedIds.length > 0 
        ? ` com ${selectedRelatedIds.length + 1} ideias vinculadas` 
        : '';
      
      toast.success(`Projeto criado com sucesso!`, {
        description: `A ideia "${idea?.name}" foi convertida${extraText}.`
      });
      
      onClose();
      
      // Navigate to the new project's detail page
      navigate(`/projects/${newProject.id}`);
    },
    onError: (error: any) => {
      console.error('Error converting idea:', error);
      toast.error('Erro ao converter ideia', {
        description: error.message || 'Tente novamente.'
      });
    }
  });

  const handleConvert = async () => {
    if (!selectedCategory) {
      toast.error('Selecione uma categoria para continuar');
      return;
    }
    setIsConverting(true);
    try {
      await convertMutation.mutateAsync({ category: selectedCategory });
    } finally {
      setIsConverting(false);
    }
  };

  const handleClose = () => {
    setSelectedRelatedIds([]);
    setIdeaSearch('');
    setShowRelatedIdeas(false);
    onClose();
  };

  if (!idea) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Converter Ideia em Projeto
          </DialogTitle>
          <DialogDescription>
            Transforme a ideia "<strong>{idea.name}</strong>" em um projeto para começar a executá-la.
          </DialogDescription>
        </DialogHeader>

        {/* Category Selection */}
        <div className="space-y-2 py-2">
          <Label>Categoria *</Label>
          <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as ProjectCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Related Ideas Section (Collapsible) */}
        {availableIdeas && availableIdeas.length > 0 && (
          <Collapsible open={showRelatedIdeas} onOpenChange={setShowRelatedIdeas}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto">
                <span className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4" />
                  Vincular ideias relacionadas
                  {selectedRelatedIds.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedRelatedIds.length} selecionada(s)
                    </Badge>
                  )}
                </span>
                {showRelatedIdeas ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Selecione outras ideias do banco para vincular ao novo projeto. Elas também serão consumidas do banco de ideias.
              </p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ideias..."
                  value={ideaSearch}
                  onChange={(e) => setIdeaSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg">
                <ScrollArea className="h-[150px]">
                  {filteredIdeas.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      {ideaSearch ? 'Nenhuma ideia encontrada' : 'Não há outras ideias disponíveis'}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredIdeas.map((relatedIdea) => (
                        <div
                          key={relatedIdea.id}
                          className={`p-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedRelatedIds.includes(relatedIdea.id) ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => toggleRelatedSelection(relatedIdea.id)}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={selectedRelatedIds.includes(relatedIdea.id)}
                              onCheckedChange={() => toggleRelatedSelection(relatedIdea.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">{relatedIdea.name}</p>
                              {relatedIdea.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {relatedIdea.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="grid gap-4 py-4">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => !isConverting && handleConvert()}
          >
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Criar Projeto</CardTitle>
                <CardDescription className="text-sm">
                  Iniciativa com sponsor, indicadores e marcos. Requer aprovação do CEO.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isConverting}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
