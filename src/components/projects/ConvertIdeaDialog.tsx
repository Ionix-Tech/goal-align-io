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
import { Briefcase, ClipboardList, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PROJECT_CATEGORIES, ProjectCategory } from '@/config/categories';

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

type ConversionType = 'project' | 'action_plan';

export function ConvertIdeaDialog({ open, onClose, idea }: ConvertIdeaDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConverting, setIsConverting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | "">(
    (idea?.category as ProjectCategory) || ""
  );

  const convertMutation = useMutation({
    mutationFn: async ({ type, category }: { type: ConversionType; category: ProjectCategory }) => {
      if (!idea || !user?.id) throw new Error('Missing data');

      // Create new project/action_plan with source_idea_id
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: idea.name,
          description: idea.description,
          initiative_type: type,
          status: 'draft',
          source_idea_id: idea.id,
          created_by: user.id,
          category: category as any,
        })
        .select()
        .single();

      if (error) throw error;
      return { newProject: data, type };
    },
    onSuccess: ({ newProject, type }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      const typeName = type === 'project' ? 'Projeto' : 'Plano de Ação';
      toast.success(`${typeName} criado com sucesso!`, {
        description: `A ideia "${idea?.name}" foi convertida em ${typeName.toLowerCase()}.`
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

  const handleConvert = async (type: ConversionType) => {
    if (!selectedCategory) {
      toast.error('Selecione uma categoria para continuar');
      return;
    }
    setIsConverting(true);
    try {
      await convertMutation.mutateAsync({ type, category: selectedCategory });
    } finally {
      setIsConverting(false);
    }
  };

  if (!idea) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Converter Ideia
          </DialogTitle>
          <DialogDescription>
            Transforme a ideia "<strong>{idea.name}</strong>" em um projeto ou plano de ação para começar a executá-la.
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

        <div className="grid gap-4 py-4">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => !isConverting && handleConvert('project')}
          >
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Projeto</CardTitle>
                <CardDescription className="text-sm">
                  Iniciativa complexa com sponsor, indicadores e marcos obrigatórios. Requer aprovação do CEO.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => !isConverting && handleConvert('action_plan')}
          >
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Plano de Ação</CardTitle>
                <CardDescription className="text-sm">
                  Iniciativa ágil e focada (2 semanas a 1.5 meses). Pode ir direto para execução sem aprovação formal.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isConverting}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
