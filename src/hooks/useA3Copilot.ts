import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { A3WizardData } from "./useA3WizardState";
import { toast } from "sonner";

type CopilotAction = 
  | "get_guidance"
  | "suggest_name"
  | "expand_objective"
  | "generate_requirements"
  | "improve_requirement"
  | "improve_action"
  | "expand_current_situation"
  | "generate_target_situation"
  | "suggest_actions"
  | "suggest_indicators"
  | "validate_step"
  | "ask_question";

interface CopilotResponse {
  message: string;
  generatedContent?: any;
  error?: string;
}

interface RequirementSuggestion {
  description: string;
}

interface ActionSuggestion {
  description: string;
  linkedRequirements: string[];
}

interface IndicatorSuggestion {
  name: string;
  unit: string;
  linkedRequirements: string[];
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

export function useA3Copilot() {
  const [isLoading, setIsLoading] = useState(false);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callCopilot = useCallback(async (
    action: CopilotAction,
    currentStep: number,
    projectData: Partial<A3WizardData>,
    specificInput?: string
  ): Promise<CopilotResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('a3-copilot', {
        body: { action, currentStep, projectData, specificInput }
      });

      if (fnError) {
        if (fnError.message?.includes('429')) {
          toast.error("Muitas requisições. Aguarde um momento.");
        } else if (fnError.message?.includes('402')) {
          toast.error("Créditos insuficientes. Adicione créditos na workspace.");
        } else {
          throw fnError;
        }
        return null;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as CopilotResponse;
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao consultar o Copilot";
      setError(errorMessage);
      console.error("Copilot error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getGuidance = useCallback(async (step: number, data: Partial<A3WizardData>) => {
    const response = await callCopilot("get_guidance", step, data);
    if (response?.message) {
      setGuidance(response.message);
    }
    return response;
  }, [callCopilot]);

  const suggestName = useCallback(async (objective: string, data: Partial<A3WizardData>): Promise<string[]> => {
    const response = await callCopilot("suggest_name", 1, data, objective);
    return response?.generatedContent?.suggestions || [];
  }, [callCopilot]);

  const expandObjective = useCallback(async (currentObjective: string, data: Partial<A3WizardData>): Promise<string | null> => {
    const response = await callCopilot("expand_objective", 1, data, currentObjective);
    return response?.generatedContent?.expandedText || null;
  }, [callCopilot]);

  const generateRequirements = useCallback(async (data: Partial<A3WizardData>): Promise<RequirementSuggestion[]> => {
    const response = await callCopilot("generate_requirements", 2, data);
    return response?.generatedContent?.requirements || [];
  }, [callCopilot]);

  const improveRequirement = useCallback(async (requirement: string, data: Partial<A3WizardData>): Promise<string | null> => {
    const response = await callCopilot("improve_requirement", 2, data, requirement);
    return response?.generatedContent?.improvedText || null;
  }, [callCopilot]);

  const improveAction = useCallback(async (actionDescription: string, data: Partial<A3WizardData>): Promise<string | null> => {
    const response = await callCopilot("improve_action", 5, data, actionDescription);
    return response?.generatedContent?.improvedText || null;
  }, [callCopilot]);

  const expandCurrentSituation = useCallback(async (current: string, data: Partial<A3WizardData>): Promise<string | null> => {
    const response = await callCopilot("expand_current_situation", 3, data, current);
    return response?.generatedContent?.expandedText || null;
  }, [callCopilot]);

  const generateTargetSituation = useCallback(async (data: Partial<A3WizardData>): Promise<string | null> => {
    const response = await callCopilot("generate_target_situation", 4, data);
    return response?.generatedContent?.targetText || null;
  }, [callCopilot]);

  const suggestActions = useCallback(async (data: Partial<A3WizardData>): Promise<ActionSuggestion[]> => {
    const response = await callCopilot("suggest_actions", 5, data);
    return response?.generatedContent?.actions || [];
  }, [callCopilot]);

  const suggestIndicators = useCallback(async (data: Partial<A3WizardData>): Promise<IndicatorSuggestion[]> => {
    const response = await callCopilot("suggest_indicators", 6, data);
    return response?.generatedContent?.indicators || [];
  }, [callCopilot]);

  const validateStep = useCallback(async (step: number, data: Partial<A3WizardData>): Promise<ValidationResult | null> => {
    const response = await callCopilot("validate_step", step, data);
    return response?.generatedContent || null;
  }, [callCopilot]);

  const askQuestion = useCallback(async (question: string, step: number, data: Partial<A3WizardData>): Promise<string | null> => {
    const response = await callCopilot("ask_question", step, data, question);
    return response?.message || null;
  }, [callCopilot]);

  const reset = useCallback(() => {
    setGuidance(null);
    setError(null);
  }, []);

  return {
    isLoading,
    guidance,
    error,
    getGuidance,
    suggestName,
    expandObjective,
    generateRequirements,
    improveRequirement,
    improveAction,
    expandCurrentSituation,
    generateTargetSituation,
    suggestActions,
    suggestIndicators,
    validateStep,
    askQuestion,
    reset
  };
}
