import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { A3WizardData } from "./useA3WizardState";
import { toast } from "sonner";

export interface SectionAnalysis {
  name: string;
  status: "complete" | "partial" | "missing";
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface Recommendation {
  priority: "high" | "medium" | "low";
  area: string;
  description: string;
  action: string;
}

export interface AIAnalysisResult {
  overallScore: number;
  summary: string;
  sections: SectionAnalysis[];
  recommendations: Recommendation[];
  strengths: string[];
  criticalGaps: string[];
}

export function useA3Analysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeProject = useCallback(async (data: A3WizardData) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: response, error: invokeError } = await supabase.functions.invoke('analyze-a3', {
        body: { projectData: data }
      });

      if (invokeError) {
        console.error("Error invoking analyze-a3:", invokeError);
        throw new Error(invokeError.message || "Failed to analyze project");
      }

      if (response?.error) {
        // Handle specific error codes
        if (response.error.includes("Rate limits")) {
          toast.error("Muitas requisições. Tente novamente em alguns segundos.");
        } else if (response.error.includes("Payment required")) {
          toast.error("Créditos insuficientes. Adicione créditos na workspace.");
        } else {
          toast.error("Erro ao analisar projeto. Tente novamente.");
        }
        throw new Error(response.error);
      }

      setAnalysis(response as AIAnalysisResult);
      toast.success("Análise concluída!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analyzeProject,
    isAnalyzing,
    analysis,
    error,
    reset
  };
}
