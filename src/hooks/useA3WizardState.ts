import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./useAuth";
import { ProjectRequirement } from "./useRequirements";
import { supabase } from "@/integrations/supabase/client";

export interface A3WizardData {
  // Step 1: Contexto
  name: string;
  objective: string;
  strategicIndicator: string;
  category: string;
  assignedTo: string;
  members: string[];
  thesisId: string;
  
  // Step 2: Requisitos
  requirements: Omit<ProjectRequirement, 'id' | 'project_id' | 'created_at' | 'updated_at'>[];
  
  // Step 3: Diagnóstico
  currentSituationDescription: string;
  // attachments handled separately via storage
  
  // Step 4: Estratégia
  targetSituationDescription: string;
  // requirements.target_value updated here
  
  // Step 5: Execução
  // tasks handled separately
  
  // Step 6: Controle
  m1Date: string;
  m2Date: string;
  m3Date: string;
}

const initialData: A3WizardData = {
  name: "",
  objective: "",
  strategicIndicator: "",
  category: "",
  assignedTo: "",
  members: [],
  thesisId: "",
  requirements: [],
  currentSituationDescription: "",
  targetSituationDescription: "",
  m1Date: "",
  m2Date: "",
  m3Date: "",
};

interface UseA3WizardStateOptions {
  initialProjectId?: string | null;
}

export function useA3WizardState(options: UseA3WizardStateOptions = {}) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<A3WizardData>(initialData);
  const [projectId, setProjectId] = useState<string | null>(options.initialProjectId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!options.initialProjectId);

  // Load existing project data
  useEffect(() => {
    async function loadProject() {
      if (!options.initialProjectId) return;
      
      setIsLoading(true);
      try {
        // Load project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', options.initialProjectId)
          .single();

        if (projectError) throw projectError;

        // Load requirements
        const { data: requirements, error: reqError } = await supabase
          .from('project_requirements')
          .select('*')
          .eq('project_id', options.initialProjectId)
          .order('display_order');

        if (reqError) throw reqError;

        // Load milestones
        const { data: milestones, error: msError } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', options.initialProjectId);

        if (msError) throw msError;

        // Map milestones to dates
        const m1 = milestones?.find(m => m.milestone_type === 'decolagem');
        const m2 = milestones?.find(m => m.milestone_type === 'voo');
        const m3 = milestones?.find(m => m.milestone_type === 'escala');

        setData({
          name: project.name || "",
          objective: project.objective || "",
          strategicIndicator: project.strategic_indicator || "",
          category: project.category || "",
          assignedTo: project.assigned_to || "",
          members: [],
          thesisId: project.thesis_id || "",
          requirements: (requirements || []).map(r => ({
            code: r.code,
            description: r.description,
            indicator_name: r.indicator_name,
            unit: r.unit,
            current_value: r.current_value,
            target_value: r.target_value,
            display_order: r.display_order
          })),
          currentSituationDescription: project.current_situation_description || "",
          targetSituationDescription: project.target_situation_description || "",
          m1Date: m1?.target_date || "",
          m2Date: m2?.target_date || "",
          m3Date: m3?.target_date || "",
        });

        setProjectId(options.initialProjectId);
        
        // Set to the step the project was on
        if (project.current_step && project.current_step >= 1 && project.current_step <= 6) {
          setCurrentStep(project.current_step);
        }
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProject();
  }, [options.initialProjectId]);

  const updateData = useCallback((updates: Partial<A3WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const addRequirement = useCallback(() => {
    const nextCode = `R${data.requirements.length + 1}`;
    setData(prev => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        {
          code: nextCode,
          description: "",
          indicator_name: null,
          unit: null,
          current_value: null,
          target_value: null,
          display_order: prev.requirements.length
        }
      ]
    }));
  }, [data.requirements.length]);

  const updateRequirement = useCallback((index: number, updates: Partial<ProjectRequirement>) => {
    setData(prev => ({
      ...prev,
      requirements: prev.requirements.map((r, i) => 
        i === index ? { ...r, ...updates } : r
      )
    }));
  }, []);

  const removeRequirement = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      requirements: prev.requirements
        .filter((_, i) => i !== index)
        .map((r, i) => ({ ...r, code: `R${i + 1}`, display_order: i }))
    }));
  }, []);

  // Validation per step
  const canProceedToStep = useMemo(() => {
    return {
      2: () => {
        // Step 1 complete: name, objective required
        return data.name.trim() !== "" && data.objective.trim() !== "";
      },
      3: () => {
        // Step 2 complete: at least 2 requirements with description
        const validReqs = data.requirements.filter(
          r => r.description.trim() !== ""
        );
        return validReqs.length >= 2;
      },
      4: () => {
        // Step 3 complete: situation description required
        return data.currentSituationDescription.trim() !== "";
        // Note: attachment validation would need to be done at component level
      },
      5: () => {
        // Step 4 complete: target description and all requirements have target_value
        if (data.targetSituationDescription.trim() === "") return false;
        return data.requirements.every(r => r.target_value !== null);
      },
      6: () => {
        // Step 5 complete: handled at component level (tasks with requirement links)
        return true;
      },
      submit: () => {
        // Step 6 complete: M1 date set (M2 and M3 auto-calculated)
        return data.m1Date !== "";
      }
    };
  }, [data]);

  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > 6) return;
    
    // Going backwards is always allowed
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }
    
    // Going forward requires validation
    for (let s = currentStep + 1; s <= step; s++) {
      const validator = canProceedToStep[s as keyof typeof canProceedToStep];
      if (typeof validator === 'function' && !validator()) {
        return; // Can't proceed
      }
    }
    
    setCurrentStep(step);
  }, [currentStep, canProceedToStep]);

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setData(initialData);
    setProjectId(null);
  }, []);

  return {
    currentStep,
    data,
    projectId,
    isSaving,
    isLoading,
    setIsSaving,
    setProjectId,
    updateData,
    addRequirement,
    updateRequirement,
    removeRequirement,
    canProceedToStep,
    goToStep,
    nextStep,
    prevStep,
    reset,
    userId: user?.id
  };
}
