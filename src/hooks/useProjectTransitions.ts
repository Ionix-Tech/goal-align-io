import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import { useToast } from './use-toast';
import { createNotification } from './useNotifications';
import type { Database } from '@/integrations/supabase/types';

type ProjectStatus = Database['public']['Enums']['project_status'];

interface Project {
  id: string;
  name: string;
  context: string | null;
  objective: string | null;
  status: ProjectStatus;
  created_by: string;
  assigned_to: string | null;
  indicators: Array<{ id: string }>;
  milestones: Array<{ id: string }>;
  initiative_type: 'idea' | 'project';
}

const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  idea: [], // Ideas cannot transition via drag - they must be converted
  draft: ['review', 'approved', 'archived'],
  review: ['approved', 'draft', 'archived'],
  approved: ['completed', 'archived'],
  completed: ['archived'],
  archived: []
};

export function useProjectTransitions() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canTransition = (from: ProjectStatus, to: ProjectStatus, project: Project) => {
    // Verificar se a transição é permitida
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      return { allowed: false, reason: 'Transição não permitida no fluxo' };
    }

    // Validação específica: submeter para análise
    if (from === 'draft' && to === 'review') {
      const validation = validateProjectForSubmission(project);
      if (!validation.valid) {
        return { allowed: false, reason: validation.message };
      }
    }

    // All users can approve projects

    // Validação: marcar como finalizado
    if (to === 'completed' && from === 'approved') {
      // Qualquer membro do projeto pode marcar como finalizado
      return { allowed: true };
    }

    // All users can modify completed projects

    // All users can archive projects in review

    // All users can return projects to draft

    return { allowed: true };
  };

  const transitionMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      newStatus, 
      comment 
    }: { 
      projectId: string; 
      newStatus: ProjectStatus; 
      comment?: string;
    }) => {
      const updates: any = { status: newStatus };

      if (newStatus === 'review') {
        updates.submitted_for_review_at = new Date().toISOString();
      }

      if (newStatus === 'approved') {
        updates.approved_by = user?.id;
        updates.approved_at = new Date().toISOString();
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select('*, created_by_profile:profiles!projects_created_by_fkey(full_name), assigned_to_profile:profiles!projects_assigned_to_fkey(full_name)')
        .single();

      if (projectError) throw projectError;

      // Criar log de auditoria
      const { data: oldProject } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single();

      await supabase
        .from('project_edit_log')
        .insert({
          project_id: projectId,
          edited_by: user?.id,
          field_name: 'status',
          old_value: oldProject?.status,
          new_value: newStatus
        });

      // Adicionar comentário se fornecido
      if (comment) {
        await supabase
          .from('project_comments')
          .insert({
            project_id: projectId,
            user_id: user?.id,
            comment
          });
      }

      return project;
    },
    onSuccess: (project, { newStatus, comment }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Criar notificações apropriadas
      handleNotifications(project, newStatus, comment);

      if (newStatus === 'review') {
        toast({ title: 'Projeto submetido para aprovação!' });
      } else if (newStatus === 'approved') {
        toast({ title: 'Projeto aprovado!', variant: 'default' });
      } else if (newStatus === 'draft') {
        toast({ title: 'Projeto devolvido para ajustes' });
      } else if (newStatus === 'archived') {
        toast({ title: 'Projeto arquivado' });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar projeto',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleNotifications = async (project: any, newStatus: ProjectStatus, comment?: string) => {
    if (!user) return;

    try {
      if (newStatus === 'review') {
        // Notificar CEO
        const { data: ceoUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'ceo');

        if (ceoUsers && ceoUsers.length > 0) {
          for (const ceoUser of ceoUsers) {
            await createNotification(
              ceoUser.user_id,
              project.id,
              'project_submitted',
              `📋 Novo projeto aguardando aprovação: ${project.name}`
            );
          }
        }
      } else if (newStatus === 'approved') {
        // Notificar criador e gestor
        if (project.created_by) {
          await createNotification(
            project.created_by,
            project.id,
            'project_approved',
            `🎉 Seu projeto "${project.name}" foi aprovado!`
          );
        }
        if (project.assigned_to && project.assigned_to !== project.created_by) {
          await createNotification(
            project.assigned_to,
            project.id,
            'project_approved',
            `🎉 O projeto "${project.name}" foi aprovado!`
          );
        }
      } else if (newStatus === 'draft' && comment) {
        // Notificar sobre rejeição/revisão
        if (project.created_by) {
          await createNotification(
            project.created_by,
            project.id,
            'project_rejected',
            `⚠️ Seu projeto "${project.name}" precisa de ajustes. Veja o feedback do CEO.`
          );
        }
        if (project.assigned_to && project.assigned_to !== project.created_by) {
          await createNotification(
            project.assigned_to,
            project.id,
            'project_rejected',
            `⚠️ O projeto "${project.name}" precisa de ajustes.`
          );
        }
      } else if (newStatus === 'archived') {
        // Notificar sobre arquivamento
        if (project.created_by) {
          await createNotification(
            project.created_by,
            project.id,
            'project_archived',
            `📦 Seu projeto "${project.name}" foi arquivado.`
          );
        }
        if (project.assigned_to && project.assigned_to !== project.created_by) {
          await createNotification(
            project.assigned_to,
            project.id,
            'project_archived',
            `📦 O projeto "${project.name}" foi arquivado.`
          );
        }
      }
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  };

  return {
    canTransition,
    transition: transitionMutation.mutate,
    isTransitioning: transitionMutation.isPending
  };
}

export function validateProjectForSubmission(project: Project) {
  const errors: string[] = [];

  if (!project.name || project.name.trim().length === 0) {
    errors.push('Nome do projeto');
  }

  // Validação rigorosa para projetos
  if (project.initiative_type === 'project') {
    if (!project.context || project.context.trim().length < 50) {
      errors.push('Contexto detalhado (mínimo 50 caracteres)');
    }

    if (!project.objective || project.objective.trim().length < 50) {
      errors.push('Objetivo definido (mínimo 50 caracteres)');
    }

    if (!project.indicators || project.indicators.length === 0) {
      errors.push('Pelo menos 1 indicador');
    }

    if (!project.milestones || project.milestones.length === 0) {
      errors.push('Pelo menos 1 marco');
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: `Projeto incompleto. Campos obrigatórios: ${errors.join(', ')}`
    };
  }

  return { valid: true };
}
