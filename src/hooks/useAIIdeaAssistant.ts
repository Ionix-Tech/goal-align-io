import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CategorySuggestion {
  category: string;
  confidence: number;
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
}

export function useAIIdeaAssistant(): UseAIIdeaAssistantReturn {
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);
  const [isLoadingExpansion, setIsLoadingExpansion] = useState(false);

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
      // Silently fail - this is a helper feature
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

  return {
    categorySuggestion,
    isLoadingCategory,
    suggestCategory,
    clearCategorySuggestion,
    
    expandedDescription,
    isLoadingExpansion,
    expandDescription,
    clearExpandedDescription,
  };
}
