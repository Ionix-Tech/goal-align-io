import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useA3WizardState } from "@/hooks/useA3WizardState";
import { A3WizardProgress } from "./A3WizardProgress";
import { Step1Context } from "./steps/Step1Context";
import { Step2Requirements } from "./steps/Step2Requirements";
import { Step3Diagnosis } from "./steps/Step3Diagnosis";
import { Step4Strategy } from "./steps/Step4Strategy";
import { Step5Execution } from "./steps/Step5Execution";
import { Step6Control } from "./steps/Step6Control";

export function A3Wizard() {
  const navigate = useNavigate();
  const { id: urlProjectId } = useParams<{ id: string }>();
  
  const {
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
    userId
  } = useA3WizardState({ initialProjectId: urlProjectId });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canNavigateTo = (step: number): boolean => {
    if (step < currentStep) return true;
    if (step === currentStep) return true;
    
    // Check all steps up to the target
    for (let s = 2; s <= step; s++) {
      const validator = canProceedToStep[s as keyof typeof canProceedToStep];
      if (typeof validator === 'function' && !validator()) {
        return false;
      }
    }
    return true;
  };

  const saveProgress = async () => {
    if (!userId) {
      toast.error("Você precisa estar logado para salvar");
      return;
    }

    setIsSaving(true);
    try {
      const currentProjectId = projectId || urlProjectId;
      
      if (currentProjectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: data.name,
            objective: data.objective,
            strategic_indicator: data.strategicIndicator,
            category: (data.category || null) as any,
            assigned_to: data.assignedTo || null,
            thesis_id: data.thesisId || null,
            current_situation_description: data.currentSituationDescription,
            target_situation_description: data.targetSituationDescription,
            current_step: currentStep,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProjectId);

        if (error) throw error;
        
        // Update or create requirements
        for (const req of data.requirements) {
          // Check if requirement exists (by code for this project)
          const { data: existingReq } = await supabase
            .from('project_requirements')
            .select('id')
            .eq('project_id', currentProjectId)
            .eq('code', req.code)
            .single();

          if (existingReq) {
            await supabase
              .from('project_requirements')
              .update({
                description: req.description,
                indicator_name: req.indicator_name,
                unit: req.unit,
                current_value: req.current_value,
                target_value: req.target_value,
                display_order: req.display_order
              })
              .eq('id', existingReq.id);
          } else {
            await supabase
              .from('project_requirements')
              .insert({
                project_id: currentProjectId,
                code: req.code,
                description: req.description,
                indicator_name: req.indicator_name,
                unit: req.unit,
                current_value: req.current_value,
                target_value: req.target_value,
                display_order: req.display_order
              });
          }
        }
        
        toast.success("Progresso salvo");
      } else {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert([{
            name: data.name || "Novo Projeto A3",
            objective: data.objective,
            strategic_indicator: data.strategicIndicator,
            category: (data.category || null) as any,
            assigned_to: data.assignedTo || null,
            thesis_id: data.thesisId || null,
            current_situation_description: data.currentSituationDescription,
            target_situation_description: data.targetSituationDescription,
            current_step: currentStep,
            status: 'draft',
            initiative_type: 'project',
            created_by: userId
          }])
          .select()
          .single();

        if (error) throw error;
        setProjectId(newProject.id);
        toast.success("Projeto criado como rascunho");
      }
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsSubmitting(true);
    try {
      // First save all data
      await saveProgress();

      const currentProjectId = projectId || urlProjectId;
      if (!currentProjectId) {
        toast.error("Projeto não encontrado");
        return;
      }

      // Create milestones if they don't exist
      const { data: existingMilestones } = await supabase
        .from('project_milestones')
        .select('id, milestone_type')
        .eq('project_id', currentProjectId);

      const milestones = [
        { title: "M1 - Decolagem", target_date: data.m1Date, milestone_type: 'decolagem' as const },
        { title: "M2 - Voo", target_date: data.m2Date, milestone_type: 'voo' as const },
        { title: "M3 - Escala", target_date: data.m3Date, milestone_type: 'escala' as const }
      ];

      for (const milestone of milestones) {
        const existing = existingMilestones?.find(m => m.milestone_type === milestone.milestone_type);
        
        if (existing) {
          await supabase
            .from('project_milestones')
            .update({ target_date: milestone.target_date })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('project_milestones')
            .insert({
              project_id: currentProjectId,
              ...milestone
            });
        }
      }

      // Update project status to review
      await supabase
        .from('projects')
        .update({
          status: 'review',
          submitted_for_review_at: new Date().toISOString()
        })
        .eq('id', currentProjectId);

      toast.success("Projeto enviado para aprovação!");
      navigate(`/projects/${currentProjectId}`);
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    const validator = canProceedToStep[(currentStep + 1) as keyof typeof canProceedToStep];
    if (typeof validator === 'function' && !validator()) {
      toast.error("Complete os campos obrigatórios para continuar");
      return;
    }
    nextStep();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Context data={data} updateData={updateData} />;
      case 2:
        return (
          <Step2Requirements
            data={data}
            addRequirement={addRequirement}
            updateRequirement={updateRequirement}
            removeRequirement={removeRequirement}
          />
        );
      case 3:
        return (
          <Step3Diagnosis
            data={data}
            updateData={updateData}
            updateRequirement={updateRequirement}
          />
        );
      case 4:
        return (
          <Step4Strategy
            data={data}
            updateData={updateData}
            updateRequirement={updateRequirement}
          />
        );
      case 5:
        return <Step5Execution data={data} />;
      case 6:
        return (
          <Step6Control
            data={data}
            updateData={updateData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  const isEditingExisting = !!urlProjectId;

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isEditingExisting ? "Detalhar Projeto A3" : "Novo Projeto A3"}
        </h1>
        <p className="text-muted-foreground">
          {isEditingExisting 
            ? "Continue o detalhamento do projeto A3"
            : "Siga as 6 etapas para criar um projeto A3 completo"
          }
        </p>
      </div>

      <A3WizardProgress
        currentStep={currentStep}
        onStepClick={goToStep}
        canNavigateTo={canNavigateTo}
      />

      <div className="mt-6">
        {renderStep()}
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </Button>

        <Button
          variant="ghost"
          onClick={saveProgress}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Salvando..." : "Salvar Rascunho"}
        </Button>

        {currentStep < 6 && (
          <Button onClick={handleNext} className="gap-2">
            Próximo
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {currentStep === 6 && (
          <div /> // Spacer - submit is in Step6
        )}
      </div>
    </div>
  );
}
