import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./useAuth";
import { ProjectRequirement } from "./useRequirements";
import { supabase } from "@/integrations/supabase/client";

export interface WizardIndicator {
  id: string;
  name: string;
  unit: string;
  currentValue: string;
  targetValue: string;
  linkedRequirementCodes: string[];
}

export interface WizardAction {
  id: string;
  description: string;
  responsibleId: string;
  dueDate: string;
  linkedRequirements: string[];
}

export interface WizardWhyLink {
  id: string;
  url: string;
  label: string;
}

export interface WizardComment {
  id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

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
  actions: WizardAction[];
  whyLinks: WizardWhyLink[];
  
  // Step 6: Controle
  indicators: WizardIndicator[];
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
  actions: [],
  whyLinks: [],
  indicators: [],
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
  const [comments, setComments] = useState<WizardComment[]>([]);

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

        // Load tasks (actions)
        const { data: tasks, error: tasksError } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', options.initialProjectId);

        if (tasksError) throw tasksError;

        // Load requirement-task links
        const { data: taskLinks } = await supabase
          .from('requirement_task_links')
          .select('task_id, requirement_id');

        // Load indicators
        const { data: indicators, error: indError } = await supabase
          .from('project_indicators')
          .select('*')
          .eq('project_id', options.initialProjectId);

        if (indError) throw indError;

        // Load requirement-indicator links
        const { data: indicatorLinks } = await supabase
          .from('requirement_indicator_links')
          .select('indicator_id, requirement_id');

        // Load why links
        const { data: whyLinks, error: whyError } = await supabase
          .from('project_why_links')
          .select('*')
          .eq('project_id', options.initialProjectId);

        if (whyError) throw whyError;

        // Load comments (for feedback panel)
        const { data: projectComments, error: commentsError } = await supabase
          .from('project_comments')
          .select(`
            id, 
            comment, 
            created_at, 
            user_id,
            profiles!project_comments_user_id_fkey(id, full_name, avatar_url)
          `)
          .eq('project_id', options.initialProjectId)
          .order('created_at', { ascending: false });

        if (commentsError) {
          console.error('Error loading comments:', commentsError);
        }

        // Format comments
        const formattedComments: WizardComment[] = (projectComments || []).map(c => {
          const profile = (c as any).profiles;
          return {
            id: c.id,
            comment: c.comment,
            created_at: c.created_at || new Date().toISOString(),
            user: {
              id: profile?.id || c.user_id,
              full_name: profile?.full_name || 'Usuário',
              avatar_url: profile?.avatar_url || null
            }
          };
        });
        setComments(formattedComments);

        // Build requirement code lookup
        const reqCodeMap = new Map<string, string>();
        const reqIdByCode = new Map<string, string>();
        (requirements || []).forEach(r => {
          reqCodeMap.set(r.id, r.code);
          reqIdByCode.set(r.code, r.id);
        });

        // Map milestones to dates
        const m1 = milestones?.find(m => m.milestone_type === 'decolagem');
        const m2 = milestones?.find(m => m.milestone_type === 'voo');
        const m3 = milestones?.find(m => m.milestone_type === 'escala');

        // Map tasks to actions
        const actions: WizardAction[] = (tasks || []).map(task => {
          const linkedReqs = (taskLinks || [])
            .filter(link => link.task_id === task.id)
            .map(link => reqCodeMap.get(link.requirement_id) || '')
            .filter(Boolean);

          return {
            id: task.id,
            description: task.title || '',
            responsibleId: task.assigned_to || '',
            dueDate: task.due_date || '',
            linkedRequirements: linkedReqs
          };
        });

        // Map indicators
        const mappedIndicators: WizardIndicator[] = (indicators || []).map(ind => {
          const linkedReqs = (indicatorLinks || [])
            .filter(link => link.indicator_id === ind.id)
            .map(link => reqCodeMap.get(link.requirement_id) || '')
            .filter(Boolean);

          return {
            id: ind.id,
            name: ind.name || '',
            unit: ind.unit || '',
            currentValue: ind.current_state || '',
            targetValue: ind.target_state || '',
            linkedRequirementCodes: linkedReqs
          };
        });

        // Map why links
        const mappedWhyLinks: WizardWhyLink[] = (whyLinks || []).map(link => ({
          id: link.id,
          url: link.url,
          label: link.label || ''
        }));

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
          actions,
          whyLinks: mappedWhyLinks,
          indicators: mappedIndicators,
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

  // Actions management
  const addAction = useCallback(() => {
    setData(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          id: crypto.randomUUID(),
          description: "",
          responsibleId: "",
          dueDate: "",
          linkedRequirements: []
        }
      ]
    }));
  }, []);

  const updateAction = useCallback((id: string, updates: Partial<WizardAction>) => {
    setData(prev => ({
      ...prev,
      actions: prev.actions.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  }, []);

  const removeAction = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== id)
    }));
  }, []);

  // Why links management
  const addWhyLink = useCallback(() => {
    setData(prev => ({
      ...prev,
      whyLinks: [
        ...prev.whyLinks,
        {
          id: crypto.randomUUID(),
          url: "",
          label: ""
        }
      ]
    }));
  }, []);

  const updateWhyLink = useCallback((id: string, updates: Partial<WizardWhyLink>) => {
    setData(prev => ({
      ...prev,
      whyLinks: prev.whyLinks.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  }, []);

  const removeWhyLink = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      whyLinks: prev.whyLinks.filter(l => l.id !== id)
    }));
  }, []);

  // Indicators management
  const setIndicators = useCallback((indicators: WizardIndicator[]) => {
    setData(prev => ({ ...prev, indicators }));
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
      },
      5: () => {
        // Step 4 complete: target description required
        return data.targetSituationDescription.trim() !== "";
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
    comments,
    setIsSaving,
    setProjectId,
    updateData,
    addRequirement,
    updateRequirement,
    removeRequirement,
    addAction,
    updateAction,
    removeAction,
    addWhyLink,
    updateWhyLink,
    removeWhyLink,
    setIndicators,
    canProceedToStep,
    goToStep,
    nextStep,
    prevStep,
    reset,
    userId: user?.id
  };
}
