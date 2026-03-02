import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2, Check, Cloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useA3WizardState, WizardAction, WizardIndicator, WizardAttachment } from "@/hooks/useA3WizardState";
import { useDebounce } from "@/hooks/useDebounce";
import { A3WizardProgress } from "./A3WizardProgress";
import { WizardFeedbackPanel } from "./WizardFeedbackPanel";
import { AICopilotPanel } from "./AICopilotPanel";
import { Step1Context } from "./steps/Step1Context";
import { Step2Requirements } from "./steps/Step2Requirements";
import { Step3Diagnosis } from "./steps/Step3Diagnosis";
import { Step4Strategy } from "./steps/Step4Strategy";
import { Step5Execution } from "./steps/Step5Execution";
import { Step6Control } from "./steps/Step6Control";
import { Step7Review } from "./steps/Step7Review";

export function A3Wizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: urlProjectId } = useParams<{ id: string }>();
  
  const {
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
    addActionWithData,
    updateAction,
    removeAction,
    addWhyLink,
    updateWhyLink,
    removeWhyLink,
    setIndicators,
    addExtraMilestone,
    updateExtraMilestone,
    removeExtraMilestone,
    canProceedToStep,
    goToStep,
    nextStep,
    prevStep,
    userId
  } = useA3WizardState({ initialProjectId: urlProjectId });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isInitialLoad = useRef(true);
  const isSavingRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  // Track mapping from local IDs to DB IDs for newly inserted tasks
  const localToDbIdMap = useRef(new Map<string, string>());

  // Shared helper: persist actions/tasks to Supabase
  const persistActions = async (
    currentProjectId: string,
    actions: WizardAction[],
    currentUserId: string
  ): Promise<void> => {
    const validActions = actions.filter(a => a.description.trim());
    const { data: existingTasks } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('project_id', currentProjectId);

    const existingTaskIds = new Set((existingTasks || []).map(t => t.id));

    // Build effective IDs: local IDs that were previously inserted get mapped to their DB IDs
    const effectiveIdMap = new Map<string, string>();
    for (const action of validActions) {
      const dbId = localToDbIdMap.current.get(action.id);
      effectiveIdMap.set(action.id, dbId && existingTaskIds.has(dbId) ? dbId : action.id);
    }
    const effectiveDbIds = new Set([...effectiveIdMap.values()]);

    const { data: milestonesData } = await supabase
      .from('project_milestones')
      .select('id, milestone_type')
      .eq('project_id', currentProjectId);

    const getMilestoneId = (linked: string | null): string | null => {
      if (!linked) return null;
      if (linked === 'm1') return milestonesData?.find(m => m.milestone_type === 'decolagem')?.id || null;
      if (linked === 'm2') return milestonesData?.find(m => m.milestone_type === 'voo')?.id || null;
      if (linked === 'm3') return milestonesData?.find(m => m.milestone_type === 'escala')?.id || null;
      return linked;
    };

    const { data: savedReqsForTasks } = await supabase
      .from('project_requirements')
      .select('id, code')
      .eq('project_id', currentProjectId);
    const reqIdByCodeForTasks = new Map<string, string>();
    (savedReqsForTasks || []).forEach(r => reqIdByCodeForTasks.set(r.code, r.id));

    // DELETE tasks that were removed from state
    const tasksToDelete = [...existingTaskIds].filter(id => !effectiveDbIds.has(id));
    if (tasksToDelete.length > 0) {
      await supabase.from('requirement_task_links').delete().in('task_id', tasksToDelete);
      await supabase.from('task_indicator_links').delete().in('task_id', tasksToDelete);
      await supabase.from('project_tasks').delete().in('id', tasksToDelete);
    }

    // Collect all link inserts to batch them
    const allReqLinks: { task_id: string; requirement_id: string }[] = [];
    const allIndLinks: { task_id: string; indicator_id: string }[] = [];
    const idsToDeleteLinks: string[] = [];

    for (const action of validActions) {
      const effectiveId = effectiveIdMap.get(action.id)!;
      const milestoneId = getMilestoneId(action.linkedMilestone);
      const taskPayload = {
        title: action.description,
        assigned_to: action.responsibleId || null,
        start_date: action.startDate || null,
        due_date: action.dueDate || null,
        status: action.status || 'not_started',
        priority: action.priority || 'medium',
        milestone_id: milestoneId
      };

      let taskId: string;

      if (existingTaskIds.has(effectiveId)) {
        // UPDATE existing task
        const { error: updateError } = await supabase.from('project_tasks').update(taskPayload).eq('id', effectiveId);
        if (updateError) {
          console.error(`Failed to update task ${effectiveId}:`, updateError);
          continue;
        }
        taskId = effectiveId;
        idsToDeleteLinks.push(taskId);
      } else {
        // INSERT new task
        const { data: newTask, error: taskError } = await supabase
          .from('project_tasks')
          .insert({
            ...taskPayload,
            project_id: currentProjectId,
            created_by: currentUserId
          })
          .select()
          .single();

        if (taskError || !newTask) {
          console.error(`Failed to insert task "${action.description}":`, taskError);
          continue;
        }
        taskId = newTask.id;
        // Track the mapping so next save knows this local ID = this DB ID
        localToDbIdMap.current.set(action.id, taskId);
      }

      // Collect links for batch insert
      for (const reqCode of action.linkedRequirements) {
        const reqId = reqIdByCodeForTasks.get(reqCode);
        if (reqId) {
          allReqLinks.push({ task_id: taskId, requirement_id: reqId });
        }
      }
      for (const indicatorId of action.linkedIndicators) {
        allIndLinks.push({ task_id: taskId, indicator_id: indicatorId });
      }
    }

    // Batch delete old links for updated tasks
    if (idsToDeleteLinks.length > 0) {
      await supabase.from('requirement_task_links').delete().in('task_id', idsToDeleteLinks);
      await supabase.from('task_indicator_links').delete().in('task_id', idsToDeleteLinks);
    }

    // Batch insert all links with error handling
    if (allReqLinks.length > 0) {
      const { error: reqLinkError } = await supabase
        .from('requirement_task_links')
        .insert(allReqLinks);
      if (reqLinkError) {
        console.error('Failed to insert requirement-task links:', reqLinkError);
        throw new Error(`Falha ao salvar vínculos de requisitos: ${reqLinkError.message}`);
      }
    }
    if (allIndLinks.length > 0) {
      const { error: indLinkError } = await supabase
        .from('task_indicator_links')
        .insert(allIndLinks);
      if (indLinkError) {
        console.error('Failed to insert task-indicator links:', indLinkError);
        throw new Error(`Falha ao salvar vínculos de indicadores: ${indLinkError.message}`);
      }
    }
  };

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

  // Helper: persist attachments to Supabase Storage and DB
  const persistAttachments = async (
    projectId: string,
    attachments: WizardAttachment[],
    category: string,
    currentUserId: string
  ): Promise<WizardAttachment[]> => {
    // Get existing DB attachments for this category
    const { data: existingDb } = await supabase
      .from('project_attachments')
      .select('id, file_path')
      .eq('project_id', projectId)
      .eq('category', category);

    const existingIds = new Set(attachments.filter(a => a.uploaded).map(a => a.id));

    // Delete removed attachments
    for (const dbAtt of (existingDb || [])) {
      if (!existingIds.has(dbAtt.id)) {
        await supabase.storage.from('project-attachments').remove([dbAtt.file_path]);
        await supabase.from('project_attachments').delete().eq('id', dbAtt.id);
      }
    }

    // Upload new attachments (those without uploaded flag)
    const updated: WizardAttachment[] = [];
    for (const att of attachments) {
      if (att.uploaded) {
        updated.push(att);
        continue;
      }
      if (!att.file) continue;

      const fileExt = att.name.split('.').pop();
      const filePath = `projects/${projectId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-attachments')
        .upload(filePath, att.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        updated.push(att);
        continue;
      }

      const { data: record, error: dbError } = await supabase
        .from('project_attachments')
        .insert({
          project_id: projectId,
          file_name: att.name,
          file_path: filePath,
          file_size: att.size,
          file_type: att.type,
          uploaded_by: currentUserId,
          category
        })
        .select()
        .single();

      if (dbError) {
        console.error('DB insert error:', dbError);
        updated.push(att);
        continue;
      }

      updated.push({
        id: record.id,
        name: att.name,
        size: att.size,
        type: att.type,
        filePath,
        uploaded: true
      });
    }

    return updated;
  };

  // Auto-save function (silent, no toast)
  const performAutoSave = useCallback(async () => {
    if (!userId || isInitialLoad.current) return;
    if (!dataRef.current.name?.trim()) return; // Don't save without a name
    if (isSavingRef.current) return; // Skip if manual save or another auto-save is in progress

    isSavingRef.current = true;
    setAutoSaveStatus('saving');
    try {
      const currentProjectId = projectId || urlProjectId;
      
      if (currentProjectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: dataRef.current.name,
            objective: dataRef.current.objective,
            strategic_indicator: dataRef.current.strategicIndicator,
            category: (dataRef.current.category || null) as any,
            assigned_to: dataRef.current.assignedTo || null,
            thesis_id: dataRef.current.thesisId || null,
            current_situation_description: dataRef.current.currentSituationDescription,
            target_situation_description: dataRef.current.targetSituationDescription,
            current_step: currentStepRef.current,
            is_critical: dataRef.current.isCritical,
            critical_reason: dataRef.current.criticalReason || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProjectId);

        if (error) throw error;
        
        // Update or create requirements
        for (const req of dataRef.current.requirements) {
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

        // --- SAVE MEMBERS (AUTO-SAVE) ---
        await supabase.from('project_members').delete().eq('project_id', currentProjectId);
        if (dataRef.current.members.length > 0) {
          await supabase.from('project_members').insert(
            dataRef.current.members.map(memberId => ({
              project_id: currentProjectId,
              user_id: memberId,
              added_by: userId
            }))
          );
        }
        // Invalidate so Step5/Step7 dropdowns pick up the updated members
        queryClient.invalidateQueries({ queryKey: ['project-team-members', currentProjectId] });

        // --- SAVE ACTIONS/TASKS (AUTO-SAVE) ---
        await persistActions(currentProjectId, dataRef.current.actions, userId!);

        // --- SAVE INDICATORS (AUTO-SAVE) ---
        if (dataRef.current.indicators.length > 0) {
          // Get existing indicators to delete
          const { data: existingIndicators } = await supabase
            .from('project_indicators')
            .select('id')
            .eq('project_id', currentProjectId);

          if (existingIndicators && existingIndicators.length > 0) {
            const indIds = existingIndicators.map(i => i.id);
            await supabase
              .from('requirement_indicator_links')
              .delete()
              .in('indicator_id', indIds);
            await supabase
              .from('project_indicators')
              .delete()
              .eq('project_id', currentProjectId);
          }

          // Get requirement IDs for linking
          const { data: savedReqs } = await supabase
            .from('project_requirements')
            .select('id, code')
            .eq('project_id', currentProjectId);

          const reqIdByCode = new Map<string, string>();
          (savedReqs || []).forEach(r => reqIdByCode.set(r.code, r.id));

          // Insert indicators
          for (const indicator of dataRef.current.indicators) {
            if (!indicator.name.trim()) continue;

            const { data: newIndicator, error: indError } = await supabase
              .from('project_indicators')
              .insert({
                project_id: currentProjectId,
                name: indicator.name,
                unit: indicator.unit || null,
                current_state: indicator.currentValue,
                target_state: indicator.targetValue
              })
              .select()
              .single();

            if (indError) throw indError;

            // Insert requirement links
            for (const reqCode of indicator.linkedRequirementCodes) {
              const reqId = reqIdByCode.get(reqCode);
              if (reqId) {
                await supabase
                  .from('requirement_indicator_links')
                  .insert({
                    indicator_id: newIndicator.id,
                    requirement_id: reqId
                  });
              }
            }
          }
        }

        // --- SAVE STRATEGIC KPIs (AUTO-SAVE) ---
        await supabase
          .from('project_strategic_kpis')
          .delete()
          .eq('project_id', currentProjectId);

        if (dataRef.current.strategicKpis.length > 0) {
          await supabase
            .from('project_strategic_kpis')
            .insert(
              dataRef.current.strategicKpis.map(kpi => ({
                project_id: currentProjectId,
                kpi_id: kpi.kpiId,
                kpi_name: kpi.kpiName
              }))
            );
        }

        // --- SAVE WHY LINKS (AUTO-SAVE) ---
        if (dataRef.current.whyLinks.length > 0) {
          await supabase
            .from('project_why_links')
            .delete()
            .eq('project_id', currentProjectId);

          for (const link of dataRef.current.whyLinks) {
            if (!link.url.trim()) continue;
            await supabase
              .from('project_why_links')
              .insert({
                project_id: currentProjectId,
                url: link.url,
                label: link.label || null
              });
          }
        }

        // --- SAVE MILESTONES (AUTO-SAVE) ---
        if (dataRef.current.m1Date || dataRef.current.m2Date || dataRef.current.m3Date || dataRef.current.extraMilestones.length > 0) {
          const { data: existingMilestones } = await supabase
            .from('project_milestones')
            .select('id, milestone_type')
            .eq('project_id', currentProjectId);

          const fixedMilestones = [
            { title: "M1 - Decolagem", target_date: dataRef.current.m1Date, milestone_type: 'decolagem' as const },
            { title: "M2 - Voo", target_date: dataRef.current.m2Date, milestone_type: 'voo' as const },
            { title: "M3 - Escala", target_date: dataRef.current.m3Date, milestone_type: 'escala' as const }
          ];

          for (const milestone of fixedMilestones) {
            if (!milestone.target_date) continue;
            const existing = existingMilestones?.find(m => m.milestone_type === milestone.milestone_type);
            if (existing) {
              await supabase
                .from('project_milestones')
                .update({ target_date: milestone.target_date })
                .eq('id', existing.id);
            } else {
              await supabase
                .from('project_milestones')
                .insert({ project_id: currentProjectId, ...milestone });
            }
          }

          // Extra milestones: delete old extras, insert new
          const extraMilestoneIds = existingMilestones
            ?.filter(m => !m.milestone_type)
            .map(m => m.id) || [];

          if (extraMilestoneIds.length > 0) {
            await supabase
              .from('project_milestones')
              .delete()
              .in('id', extraMilestoneIds);
          }

          for (const milestone of dataRef.current.extraMilestones) {
            if (!milestone.title.trim() || !milestone.targetDate) continue;
            await supabase
              .from('project_milestones')
              .insert({
                project_id: currentProjectId,
                title: milestone.title,
                description: milestone.description || null,
                target_date: milestone.targetDate,
                milestone_type: null
              });
          }
        }

        // --- SAVE ATTACHMENTS (AUTO-SAVE) ---
        const updatedCurrentAtts = await persistAttachments(
          currentProjectId, dataRef.current.currentSituationAttachments, 'current_situation', userId!
        );
        const updatedTargetAtts = await persistAttachments(
          currentProjectId, dataRef.current.targetSituationAttachments, 'target_situation', userId!
        );
        // Update refs so we don't re-upload next time
        dataRef.current = {
          ...dataRef.current,
          currentSituationAttachments: updatedCurrentAtts,
          targetSituationAttachments: updatedTargetAtts
        };

        setAutoSaveStatus('saved');
      } else {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert([{
            name: dataRef.current.name || "Novo Projeto A3",
            objective: dataRef.current.objective,
            strategic_indicator: dataRef.current.strategicIndicator,
            category: (dataRef.current.category || null) as any,
            assigned_to: dataRef.current.assignedTo || null,
            thesis_id: dataRef.current.thesisId || null,
            current_situation_description: dataRef.current.currentSituationDescription,
            target_situation_description: dataRef.current.targetSituationDescription,
            current_step: currentStepRef.current,
            is_critical: dataRef.current.isCritical,
            critical_reason: dataRef.current.criticalReason || null,
            status: 'draft',
            initiative_type: 'project',
            created_by: userId
          }])
          .select()
          .single();

        if (error) throw error;
        setProjectId(newProject.id);
        // Update URL without reload
        window.history.replaceState(null, '', `/create-a3/${newProject.id}`);

        // Save strategic KPIs for new project
        if (dataRef.current.strategicKpis.length > 0) {
          await supabase
            .from('project_strategic_kpis')
            .insert(
              dataRef.current.strategicKpis.map(kpi => ({
                project_id: newProject.id,
                kpi_id: kpi.kpiId,
                kpi_name: kpi.kpiName
              }))
            );
        }

        setAutoSaveStatus('saved');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [userId, projectId, urlProjectId, setProjectId]);

  // Debounced auto-save (2 seconds)
  const debouncedAutoSave = useDebounce(performAutoSave, 2000);

  // Watch for data changes and trigger auto-save
  useEffect(() => {
    if (isInitialLoad.current) {
      // Skip first render after loading
      const timer = setTimeout(() => {
        isInitialLoad.current = false;
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    setAutoSaveStatus('idle');
    debouncedAutoSave();
  }, [data, debouncedAutoSave]);

  const saveProgress = async () => {
    if (!userId) {
      toast.error("Você precisa estar logado para salvar");
      return;
    }

    // Cancel any pending autosave and wait if one is in-flight
    debouncedAutoSave.cancel();
    if (isSavingRef.current) {
      // Wait for in-flight autosave to complete (max 5s)
      let waited = 0;
      while (isSavingRef.current && waited < 5000) {
        await new Promise(r => setTimeout(r, 100));
        waited += 100;
      }
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      // Use dataRef.current for freshest state (avoids stale closure)
      const currentData = dataRef.current;
      const currentProjectId = projectId || urlProjectId;

      if (currentProjectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: currentData.name,
            objective: currentData.objective,
            strategic_indicator: currentData.strategicIndicator,
            category: (currentData.category || null) as any,
            assigned_to: currentData.assignedTo || null,
            thesis_id: currentData.thesisId || null,
            current_situation_description: currentData.currentSituationDescription,
            target_situation_description: currentData.targetSituationDescription,
            current_step: currentStepRef.current,
            is_critical: currentData.isCritical,
            critical_reason: currentData.criticalReason || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProjectId);

        if (error) throw error;

        // Update or create requirements
        for (const req of currentData.requirements) {
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

        // --- SAVE MEMBERS (MANUAL SAVE) ---
        await supabase.from('project_members').delete().eq('project_id', currentProjectId);
        if (currentData.members.length > 0) {
          await supabase.from('project_members').insert(
            currentData.members.map(memberId => ({
              project_id: currentProjectId,
              user_id: memberId,
              added_by: userId
            }))
          );
        }
        queryClient.invalidateQueries({ queryKey: ['project-team-members', currentProjectId] });

        // --- SAVE ACTIONS/TASKS (MANUAL SAVE) ---
        await persistActions(currentProjectId, currentData.actions, userId!);

        // --- SAVE INDICATORS (MANUAL SAVE) ---
        if (currentData.indicators.length > 0) {
          // Get existing indicators to delete
          const { data: existingIndicators } = await supabase
            .from('project_indicators')
            .select('id')
            .eq('project_id', currentProjectId);

          if (existingIndicators && existingIndicators.length > 0) {
            const indIds = existingIndicators.map(i => i.id);
            await supabase
              .from('requirement_indicator_links')
              .delete()
              .in('indicator_id', indIds);
            await supabase
              .from('project_indicators')
              .delete()
              .eq('project_id', currentProjectId);
          }

          // Get requirement IDs for linking
          const { data: savedReqs } = await supabase
            .from('project_requirements')
            .select('id, code')
            .eq('project_id', currentProjectId);

          const reqIdByCode = new Map<string, string>();
          (savedReqs || []).forEach(r => reqIdByCode.set(r.code, r.id));

          // Insert indicators
          for (const indicator of currentData.indicators) {
            if (!indicator.name.trim()) continue;

            const { data: newIndicator, error: indError } = await supabase
              .from('project_indicators')
              .insert({
                project_id: currentProjectId,
                name: indicator.name,
                unit: indicator.unit || null,
                current_state: indicator.currentValue,
                target_state: indicator.targetValue
              })
              .select()
              .single();

            if (indError) throw indError;

            // Insert requirement links
            for (const reqCode of indicator.linkedRequirementCodes) {
              const reqId = reqIdByCode.get(reqCode);
              if (reqId) {
                await supabase
                  .from('requirement_indicator_links')
                  .insert({
                    indicator_id: newIndicator.id,
                    requirement_id: reqId
                  });
              }
            }
          }
        }

        // --- SAVE STRATEGIC KPIs (MANUAL SAVE) ---
        await supabase
          .from('project_strategic_kpis')
          .delete()
          .eq('project_id', currentProjectId);

        if (currentData.strategicKpis.length > 0) {
          await supabase
            .from('project_strategic_kpis')
            .insert(
              currentData.strategicKpis.map(kpi => ({
                project_id: currentProjectId,
                kpi_id: kpi.kpiId,
                kpi_name: kpi.kpiName
              }))
            );
        }

        // --- SAVE ATTACHMENTS (MANUAL SAVE) ---
        const updatedCurrentAtts = await persistAttachments(
          currentProjectId, currentData.currentSituationAttachments, 'current_situation', userId!
        );
        const updatedTargetAtts = await persistAttachments(
          currentProjectId, currentData.targetSituationAttachments, 'target_situation', userId!
        );
        updateData({
          currentSituationAttachments: updatedCurrentAtts,
          targetSituationAttachments: updatedTargetAtts
        });

        toast.success("Progresso salvo");
      } else {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert([{
            name: currentData.name || "Novo Projeto A3",
            objective: currentData.objective,
            strategic_indicator: currentData.strategicIndicator,
            category: (currentData.category || null) as any,
            assigned_to: currentData.assignedTo || null,
            thesis_id: currentData.thesisId || null,
            current_situation_description: currentData.currentSituationDescription,
            target_situation_description: currentData.targetSituationDescription,
            current_step: currentStepRef.current,
            is_critical: currentData.isCritical,
            critical_reason: currentData.criticalReason || null,
            status: 'draft',
            initiative_type: 'project',
            created_by: userId
          }])
          .select()
          .single();

        if (error) throw error;
        setProjectId(newProject.id);

        // Save strategic KPIs for new project
        if (currentData.strategicKpis.length > 0) {
          await supabase
            .from('project_strategic_kpis')
            .insert(
              currentData.strategicKpis.map(kpi => ({
                project_id: newProject.id,
                kpi_id: kpi.kpiId,
                kpi_name: kpi.kpiName
              }))
            );
        }

        toast.success("Projeto criado como rascunho");
      }
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
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

      // Tasks and indicators are already persisted by saveProgress() above.
      // Below we persist data that saveProgress does NOT handle:
      // whyLinks, milestones, strategicKpis, and status change.
      const submitData = dataRef.current;

      // --- PERSIST WHY LINKS ---
      // Delete existing why links
      await supabase
        .from('project_why_links')
        .delete()
        .eq('project_id', currentProjectId);

      // Insert new why links
      for (const link of submitData.whyLinks) {
        if (!link.url.trim()) continue;

        await supabase
          .from('project_why_links')
          .insert({
            project_id: currentProjectId,
            url: link.url,
            label: link.label || null
          });
      }

      // --- PERSIST MILESTONES ---
      const { data: existingMilestones } = await supabase
        .from('project_milestones')
        .select('id, milestone_type')
        .eq('project_id', currentProjectId);

      // Fixed milestones (M1, M2, M3)
      const fixedMilestones = [
        { title: "M1 - Decolagem", target_date: submitData.m1Date, milestone_type: 'decolagem' as const },
        { title: "M2 - Voo", target_date: submitData.m2Date, milestone_type: 'voo' as const },
        { title: "M3 - Escala", target_date: submitData.m3Date, milestone_type: 'escala' as const }
      ];

      for (const milestone of fixedMilestones) {
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

      // --- PERSIST EXTRA MILESTONES ---
      // Delete existing extra milestones (those without milestone_type)
      const extraMilestoneIds = existingMilestones
        ?.filter(m => !m.milestone_type)
        .map(m => m.id) || [];
      
      if (extraMilestoneIds.length > 0) {
        await supabase
          .from('project_milestones')
          .delete()
          .in('id', extraMilestoneIds);
      }

      // Insert new extra milestones
      for (const milestone of submitData.extraMilestones) {
        if (!milestone.title.trim() || !milestone.targetDate) continue;
        
        await supabase
          .from('project_milestones')
          .insert({
            project_id: currentProjectId,
            title: milestone.title,
            description: milestone.description || null,
            target_date: milestone.targetDate,
            milestone_type: null
          });
      }

      // --- PERSIST STRATEGIC KPIs ---
      // Delete existing strategic KPIs for this project
      await supabase
        .from('project_strategic_kpis')
        .delete()
        .eq('project_id', currentProjectId);

      // Insert new strategic KPIs
      for (const kpi of submitData.strategicKpis) {
        await supabase
          .from('project_strategic_kpis')
          .insert({
            project_id: currentProjectId,
            kpi_id: kpi.kpiId,
            kpi_name: kpi.kpiName
          });
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
          />
        );
      case 4:
        return (
          <Step4Strategy
            data={data}
            updateData={updateData}
          />
        );
      case 5:
        return (
          <Step5Execution
            data={data}
            projectId={projectId || urlProjectId || null}
            addAction={addAction}
            updateAction={updateAction}
            removeAction={removeAction}
            addWhyLink={addWhyLink}
            updateWhyLink={updateWhyLink}
            removeWhyLink={removeWhyLink}
          />
        );
      case 6:
        return (
          <Step6Control
            data={data}
            updateData={updateData}
            setIndicators={setIndicators}
            addExtraMilestone={addExtraMilestone}
            updateExtraMilestone={updateExtraMilestone}
            removeExtraMilestone={removeExtraMilestone}
          />
        );
      case 7:
        return (
          <Step7Review
            data={data}
            projectId={projectId || urlProjectId || null}
            goToStep={goToStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            updateAction={updateAction}
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

  // Copilot handlers
  const handleApplySuggestion = (field: string, value: any) => {
    updateData({ [field]: value });
  };

  const handleApplyRequirements = (requirements: { description: string }[]) => {
    // Capture startIndex BEFORE adding new requirements
    const startIndex = data.requirements.length;
    requirements.forEach(() => {
      addRequirement();
    });
    // Update the requirements after they're added with staggered timeouts
    requirements.forEach((req, i) => {
      setTimeout(() => {
        updateRequirement(startIndex + i, { description: req.description });
      }, 100 + (50 * i));
    });
  };

  const handleApplyActions = (actions: { description: string; linkedRequirements: string[] }[]) => {
    // Capture the IDs we'll need to update AFTER adding
    const startIndex = dataRef.current.actions.length;

    // First, add all empty actions
    actions.forEach(() => {
      addAction();
    });

    // Then update each action with generated content using staggered timeouts
    actions.forEach((action, i) => {
      setTimeout(() => {
        // Use dataRef.current to get the LATEST state, not a stale closure
        const targetAction = dataRef.current.actions[startIndex + i];
        if (targetAction) {
          updateAction(targetAction.id, {
            description: action.description,
            linkedRequirements: action.linkedRequirements
          });
        }
      }, 150 + (50 * i));
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditingExisting ? "Detalhar Projeto A3" : "Novo Projeto A3"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditingExisting 
                    ? "Continue o detalhamento do projeto A3"
                    : "Siga as 7 etapas para criar um projeto A3 completo"
                  }
                </p>
              </div>
              
              {/* Auto-save status indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Cloud className="w-4 h-4 animate-pulse" />
                    <span>Salvando...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Salvo</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-destructive">Erro ao salvar</span>
                )}
              </div>
            </div>
          </div>

          {comments.length > 0 && (
            <div className="mb-4">
              <WizardFeedbackPanel comments={comments} />
            </div>
          )}

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

            {currentStep < 7 && (
              <Button onClick={handleNext} className="gap-2">
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            {currentStep === 7 && (
              <div /> // Spacer - submit is in Step7
            )}
          </div>
        </div>

        {/* AI Copilot Panel */}
        <div className="hidden lg:block">
          <AICopilotPanel
            currentStep={currentStep}
            data={data}
            onApplySuggestion={handleApplySuggestion}
            onApplyRequirements={handleApplyRequirements}
            onApplyActions={handleApplyActions}
          />
        </div>
      </div>
    </div>
  );
}
