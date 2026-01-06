import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/config/categories";
import { useAIIdeaAssistant } from "@/hooks/useAIIdeaAssistant";
import { AICategorySuggestion } from "@/components/ideas/AICategorySuggestion";
import { AIExpandDescriptionButton } from "@/components/ideas/AIExpandDescriptionButton";
import { AIExpandedDescriptionPreview } from "@/components/ideas/AIExpandedDescriptionPreview";
import { useDebouncedValue } from "@/hooks/useDebounce";

const QuickIdea = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory | "">("");
  const [submitting, setSubmitting] = useState(false);

  const {
    categorySuggestion,
    isLoadingCategory,
    suggestCategory,
    clearCategorySuggestion,
    expandedDescription,
    isLoadingExpansion,
    expandDescription,
    clearExpandedDescription,
  } = useAIIdeaAssistant();

  // Debounce para sugestão de categoria
  const debouncedTitle = useDebouncedValue(title, 800);
  const debouncedDescription = useDebouncedValue(description, 800);

  // Auto-sugerir categoria quando título e descrição mudarem
  useEffect(() => {
    if (debouncedTitle.trim().length >= 5 && debouncedDescription.trim().length >= 10 && !category) {
      suggestCategory(debouncedTitle, debouncedDescription);
    }
  }, [debouncedTitle, debouncedDescription, category, suggestCategory]);

  const handleAcceptCategory = useCallback((suggestedCategory: ProjectCategory) => {
    setCategory(suggestedCategory);
    clearCategorySuggestion();
  }, [clearCategorySuggestion]);

  const handleExpandDescription = useCallback(() => {
    expandDescription(title, description);
  }, [title, description, expandDescription]);

  const handleAcceptExpandedDescription = useCallback(() => {
    if (expandedDescription) {
      setDescription(expandedDescription);
      clearExpandedDescription();
    }
  }, [expandedDescription, clearExpandedDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("Você precisa estar autenticado para criar uma ideia");
      navigate('/auth');
      return;
    }

    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!description.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }

    setSubmitting(true);

    try {
      const ideaData = {
        name: title,
        description: description,
        status: 'idea' as const,
        initiative_type: 'idea' as const,
        created_by: user.id,
        assigned_to: null,
        category: category || null,
      };

      console.log('Creating idea with data:', ideaData);

      const { data, error } = await supabase
        .from('projects')
        .insert(ideaData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Ideia criada com sucesso!", {
        description: "Ela será priorizada em breve"
      });
      navigate('/prioritization');
    } catch (error: any) {
      console.error('Error creating idea:', error);
      
      if (error.code === '23502') {
        toast.error("Erro: campos obrigatórios não preenchidos");
      } else if (error.code === '42501') {
        toast.error("Erro: você não tem permissão para criar ideias");
      } else if (error.message) {
        toast.error(`Erro ao criar ideia: ${error.message}`);
      } else {
        toast.error("Erro ao criar ideia. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container max-w-3xl py-8 px-4 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/prioritization')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Nova Ideia Rápida</h1>
        </div>
        <p className="text-muted-foreground">
          Registre uma ideia estratégica que será priorizada posteriormente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Ideia</CardTitle>
            <CardDescription>
              Compartilhe sua visão de forma simples. A IA irá ajudar a estruturar sua ideia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título da Ideia */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Ideia *</Label>
              <Input
                id="title"
                placeholder="Ex: Automatizar processo de vendas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Descrição da Ideia */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descrição *</Label>
                <AIExpandDescriptionButton
                  isLoading={isLoadingExpansion}
                  disabled={!title.trim() || description.length < 10}
                  onClick={handleExpandDescription}
                />
              </div>
              <Textarea
                id="description"
                placeholder="Descreva a ideia, o problema que resolve ou a oportunidade que identifica..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* Preview da descrição expandida */}
            {expandedDescription && (
              <AIExpandedDescriptionPreview
                expandedDescription={expandedDescription}
                onAccept={handleAcceptExpandedDescription}
                onDismiss={clearExpandedDescription}
              />
            )}

            {/* Categoria (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria (opcional)</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as ProjectCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
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

              {/* Sugestão de categoria pela IA */}
              {!category && (
                <AICategorySuggestion
                  suggestion={categorySuggestion}
                  isLoading={isLoadingCategory}
                  onAccept={handleAcceptCategory}
                  onDismiss={clearCategorySuggestion}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/prioritization')}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Criando..." : "Criar Ideia"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuickIdea;
