import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lightbulb, Target, Zap, User, Calendar, Save, ArrowRight } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROJECT_CATEGORIES, ProjectCategory, getCategoryConfig } from '@/config/categories';
import { useTheses } from '@/hooks/useTheses';
import { useUpdateIdea } from '@/hooks/useUpdateIdea';

interface IdeaProject {
  id: string;
  name: string;
  description: string | null;
  category: ProjectCategory | null;
  thesis_id: string | null;
  ai_impact_score: number | null;
  ai_effort_score: number | null;
  ai_analysis_summary: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by_profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface IdeaDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  idea: IdeaProject | null;
  onConvert?: () => void;
}

export function IdeaDetailsDialog({ open, onClose, idea, onConvert }: IdeaDetailsDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory | ''>('');
  const [thesisId, setThesisId] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: theses } = useTheses({ includeArchived: false });
  const updateIdea = useUpdateIdea();

  // Initialize form when idea changes
  useEffect(() => {
    if (idea) {
      setName(idea.name || '');
      setDescription(idea.description || '');
      setCategory((idea.category as ProjectCategory) || '');
      setThesisId(idea.thesis_id || '');
      setHasChanges(false);
    }
  }, [idea]);

  // Track changes
  useEffect(() => {
    if (!idea) return;
    const changed = 
      name !== (idea.name || '') ||
      description !== (idea.description || '') ||
      category !== ((idea.category as ProjectCategory) || '') ||
      thesisId !== (idea.thesis_id || '');
    setHasChanges(changed);
  }, [name, description, category, thesisId, idea]);

  const handleSave = async () => {
    if (!idea) return;
    
    if (!name.trim() || name.trim().length < 3) {
      return;
    }

    await updateIdea.mutateAsync({
      id: idea.id,
      name: name.trim(),
      description: description.trim() || null,
      category: category || null,
      thesis_id: thesisId || null
    });

    onClose();
  };

  const handleClose = () => {
    setHasChanges(false);
    onClose();
  };

  const handleConvert = () => {
    handleClose();
    onConvert?.();
  };

  if (!idea) return null;

  const categoryConfig = getCategoryConfig(category);
  const selectedThesis = theses?.find(t => t.id === thesisId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Detalhes da Ideia
          </DialogTitle>
          <DialogDescription>
            Visualize e edite os campos da ideia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Informações Básicas
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="idea-name">Título *</Label>
              <Input
                id="idea-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da ideia"
              />
              {name.trim().length > 0 && name.trim().length < 3 && (
                <p className="text-xs text-destructive">Mínimo 3 caracteres</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea-description">Descrição</Label>
              <Textarea
                id="idea-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a ideia..."
                rows={4}
              />
            </div>
          </div>

          <Separator />

          {/* Categorization Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Categorização
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as ProjectCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
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

              <div className="space-y-2">
                <Label>Objetivo Estratégico</Label>
                <Select value={thesisId} onValueChange={setThesisId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {theses?.map((thesis) => (
                      <SelectItem key={thesis.id} value={thesis.id}>
                        {thesis.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* AI Analysis Section (Read-only) */}
          {(idea.ai_impact_score !== null || idea.ai_effort_score !== null || idea.ai_analysis_summary) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Avaliação de IA
                </h3>
                
                <div className="flex gap-4">
                  {idea.ai_impact_score !== null && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Impacto:</span>
                      <Badge variant="secondary">{idea.ai_impact_score}/10</Badge>
                    </div>
                  )}
                  
                  {idea.ai_effort_score !== null && (
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Esforço:</span>
                      <Badge variant="secondary">{idea.ai_effort_score}/10</Badge>
                    </div>
                  )}
                </div>

                {idea.ai_analysis_summary && (
                  <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                    {idea.ai_analysis_summary}
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Metadata Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Metadados
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Criado por:</span>
                <span className="text-foreground font-medium">
                  {idea.created_by_profile?.full_name || 'Desconhecido'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Em:</span>
                <span className="text-foreground">
                  {idea.created_at 
                    ? format(new Date(idea.created_at), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'
                  }
                </span>
              </div>

              {idea.updated_at && (
                <div className="col-span-2 text-muted-foreground">
                  Atualizado {formatDistanceToNow(new Date(idea.updated_at), { locale: ptBR, addSuffix: true })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleConvert}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Converter em Projeto
          </Button>
          
          <div className="flex-1" />
          
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updateIdea.isPending || name.trim().length < 3}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
