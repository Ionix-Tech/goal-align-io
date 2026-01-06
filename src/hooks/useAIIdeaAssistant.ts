import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
}

interface ImpactEffortEvaluation {
  impact_score: number;
  effort_score: number;
  impact_reason: string;
  effort_reason: string;
  summary: string;
}

interface SimilarIdea {
  id: string;
  name: string;
  similarity_score: number;
  reason: string;
}

interface StrategicSuggestion {
  thesis_id: string;
  thesis_name: string;
  alignment_score: number;
  reason: string;
}

interface UseAIIdeaAssistantReturn {
  // Category suggestion
  categorySuggestion: CategorySuggestion | null;
  isLoadingCategory: boolean;
  suggestCategory: (title: string, description: string) => Promise<void>;
  clearCategorySuggestion: () => void;
  
  // Description expansion
  expandedDescription: string | null;
  isLoadingExpansion: boolean;
  expandDescription: (title: string, description: string) => Promise<void>;
  clearExpandedDescription: () => void;

  // Impact/Effort evaluation
  evaluation: ImpactEffortEvaluation | null;
  isLoadingEvaluation: boolean;
  evaluateIdea: (title: string, description: string) => Promise<void>;
  clearEvaluation: () => void;

  // Similar ideas detection
  similarIdeas: SimilarIdea[];
  isLoadingSimilar: boolean;
  findSimilarIdeas: (title: string, description: string) => Promise<void>;
  clearSimilarIdeas: () => void;

  // Strategic alignment suggestions
  strategicSuggestions: StrategicSuggestion[];
  isLoadingStrategic: boolean;
  suggestStrategicAlignment: (title: string, description: string) => Promise<void>;
  clearStrategicSuggestions: () => void;
}

export function useAIIdeaAssistant(): UseAIIdeaAssistantReturn {
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);
  const [isLoadingExpansion, setIsLoadingExpansion] = useState(false);

  const [evaluation, setEvaluation] = useState<ImpactEffortEvaluation | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);

  const [similarIdeas, setSimilarIdeas] = useState<SimilarIdea[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  const [strategicSuggestions, setStrategicSuggestions] = useState<StrategicSuggestion[]>([]);
  const [isLoadingStrategic, setIsLoadingStrategic] = useState(false);

  const suggestCategory = useCallback(async (title: string, description: string) => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    setIsLoadingCategory(true);
    setCategorySuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-idea-assistant', {
        body: {
          action: 'categorize',
          title,
          description,
        },
      });

      if (error) throw error;

      if (data?.category) {
        setCategorySuggestion({
          category: data.category,
          confidence: data.confidence || 0.5,
          reason: data.reason || '',
        });
      }
    } catch (error) {
      console.error('Error suggesting category:', error);
    } finally {
      setIsLoadingCategory(false);
    }
  }, []);

  const clearCategorySuggestion = useCallback(() => {
    setCategorySuggestion(null);
  }, []);

  const expandDescription = useCallback(async (title: string, description: string) => {
    if (!title.trim() || !description.trim()) {
      toast.error('Preencha o título e a descrição primeiro');
      return;
    }

    if (description.length < 10) {
      toast.error('A descrição precisa ter pelo menos 10 caracteres');
      return;
    }

    setIsLoadingExpansion(true);
    setExpandedDescription(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-idea-assistant', {
        body: {
          action: 'expand',
          title,
          description,
        },
      });

      if (error) throw error;

      if (data?.expandedDescription) {
        setExpandedDescription(data.expandedDescription);
        toast.success('Descrição expandida com sucesso!');
      }
    } catch (error: any) {
      console.error('Error expanding description:', error);
      
      if (error?.message?.includes('429')) {
        toast.error('Limite de requisições atingido. Aguarde alguns segundos.');
      } else if (error?.message?.includes('402')) {
        toast.error('Créditos de IA esgotados.');
      } else {
        toast.error('Erro ao expandir descrição. Tente novamente.');
      }
    } finally {
      setIsLoadingExpansion(false);
    }
  }, []);

  const clearExpandedDescription = useCallback(() => {
    setExpandedDescription(null);
  }, []);

  const evaluateIdea = useCallback(async (title: string, description: string) => {
    if (!title.trim() || !description.trim()) {
      toast.error('Preencha o título e a descrição primeiro');
      return;
    }

    if (description.length < 20) {
      toast.error('A descrição precisa ter pelo menos 20 caracteres para avaliação');
      return;
    }

    setIsLoadingEvaluation(true);
    setEvaluation(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-idea-assistant', {
        body: {
          action: 'evaluate',
          title,
          description,
        },
      });

      if (error) throw error;

      if (data?.impact_score && data?.effort_score) {
        setEvaluation({
          impact_score: data.impact_score,
          effort_score: data.effort_score,
          impact_reason: data.impact_reason || '',
          effort_reason: data.effort_reason || '',
          summary: data.summary || '',
        });
        toast.success('Avaliação concluída!');
      }
    } catch (error: any) {
      console.error('Error evaluating idea:', error);
      
      if (error?.message?.includes('429')) {
        toast.error('Limite de requisições atingido. Aguarde alguns segundos.');
      } else if (error?.message?.includes('402')) {
        toast.error('Créditos de IA esgotados.');
      } else {
        toast.error('Erro ao avaliar ideia. Tente novamente.');
      }
    } finally {
      setIsLoadingEvaluation(false);
    }
  }, []);

  const clearEvaluation = useCallback(() => {
    setEvaluation(null);
  }, []);

  const findSimilarIdeas = useCallback(async (title: string, description: string) => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    setIsLoadingSimilar(true);
    setSimilarIdeas([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-idea-assistant', {
        body: {
          action: 'find_similar',
          title,
          description,
        },
      });

      if (error) throw error;

      if (data?.similar_ideas && Array.isArray(data.similar_ideas)) {
        setSimilarIdeas(data.similar_ideas);
        if (data.similar_ideas.length > 0) {
          toast.info(`Encontrada(s) ${data.similar_ideas.length} ideia(s) similar(es)`);
        }
      }
    } catch (error: any) {
      console.error('Error finding similar ideas:', error);
      // Don't show error toast for similarity - it's a nice-to-have feature
    } finally {
      setIsLoadingSimilar(false);
    }
  }, []);

  const clearSimilarIdeas = useCallback(() => {
    setSimilarIdeas([]);
  }, []);

  const suggestStrategicAlignment = useCallback(async (title: string, description: string) => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    setIsLoadingStrategic(true);
    setStrategicSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-idea-assistant', {
        body: {
          action: 'suggest_strategic',
          title,
          description,
        },
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setStrategicSuggestions(data.suggestions);
        if (data.suggestions.length > 0) {
          toast.success(`${data.suggestions.length} objetivo(s) estratégico(s) sugerido(s)`);
        }
      }
    } catch (error: any) {
      console.error('Error suggesting strategic alignment:', error);
      // Don't show error toast - it's a nice-to-have feature
    } finally {
      setIsLoadingStrategic(false);
    }
  }, []);

  const clearStrategicSuggestions = useCallback(() => {
    setStrategicSuggestions([]);
  }, []);

  return {
    categorySuggestion,
    isLoadingCategory,
    suggestCategory,
    clearCategorySuggestion,
    
    expandedDescription,
    isLoadingExpansion,
    expandDescription,
    clearExpandedDescription,

    evaluation,
    isLoadingEvaluation,
    evaluateIdea,
    clearEvaluation,

    similarIdeas,
    isLoadingSimilar,
    findSimilarIdeas,
    clearSimilarIdeas,

    strategicSuggestions,
    isLoadingStrategic,
    suggestStrategicAlignment,
    clearStrategicSuggestions,
  };
}
