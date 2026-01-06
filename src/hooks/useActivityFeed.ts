import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, startOfMonth, subMonths } from 'date-fns';

export type ActivityType = 
  | 'indicator' 
  | 'milestone' 
  | 'task_status' 
  | 'task_date'
  | 'milestone_date'
  | 'situation' 
  | 'comment' 
  | 'health'
  | 'attachment';

export interface ActivityFeedFilters {
  period: 'week' | 'month' | 'quarter' | 'custom';
  startDate?: string;
  endDate?: string;
  activityType: 'all' | ActivityType;
  projectId?: string;
  thesisId?: string;
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  timestamp: string;
  projectId: string;
  projectName: string;
  thesisId: string | null;
  thesisName: string | null;
  title: string;
  description: string;
  progress?: number;
  previousProgress?: number;
  isCritical?: boolean;
  notes?: string;
  unit?: string;
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    oldDate?: string;
    newDate?: string;
    reason?: string;
    healthStatus?: 'green' | 'yellow' | 'red';
    fileName?: string;
    fileType?: string;
  };
  updatedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
}

function getDateRange(period: ActivityFeedFilters['period'], startDate?: string, endDate?: string) {
  const now = new Date();
  
  if (period === 'custom' && startDate && endDate) {
    return { start: startDate, end: endDate };
  }
  
  let start: Date;
  switch (period) {
    case 'week':
      start = startOfWeek(now);
      break;
    case 'month':
      start = startOfMonth(now);
      break;
    case 'quarter':
      start = subMonths(now, 3);
      break;
    default:
      start = startOfWeek(now);
  }
  
  return { 
    start: start.toISOString(), 
    end: now.toISOString() 
  };
}

export function useActivityFeed(filters: ActivityFeedFilters) {
  return useQuery({
    queryKey: ['activity-feed', filters],
    queryFn: async () => {
      const { start, end } = getDateRange(filters.period, filters.startDate, filters.endDate);
      const activities: ActivityFeedItem[] = [];

      // Helper to check if we should fetch this type
      const shouldFetch = (type: ActivityType) => 
        filters.activityType === 'all' || filters.activityType === type;

      // Fetch indicator updates
      if (shouldFetch('indicator')) {
        let indicatorQuery = supabase
          .from('project_indicator_updates')
          .select(`
            id,
            measured_value,
            progress_percentage,
            measurement_date,
            notes,
            created_at,
            updated_by,
            indicator_id,
            project_indicators!inner (
              name,
              unit,
              project_id,
              projects!inner (
                id,
                name,
                thesis_id,
                strategic_theses (
                  id,
                  name
                )
              )
            ),
            profiles:updated_by (
              full_name,
              avatar_url
            )
          `)
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at', { ascending: false });

        if (filters.projectId) {
          indicatorQuery = indicatorQuery.eq('project_indicators.projects.id', filters.projectId);
        }

        if (filters.thesisId) {
          indicatorQuery = indicatorQuery.eq('project_indicators.projects.thesis_id', filters.thesisId);
        }

        const { data: indicatorUpdates } = await indicatorQuery;

        if (indicatorUpdates) {
          const indicatorIds = [...new Set(indicatorUpdates.map(u => u.indicator_id))];
          const previousProgressMap = new Map<string, number>();

          for (const indicatorId of indicatorIds) {
            const { data: prevUpdates } = await supabase
              .from('project_indicator_updates')
              .select('progress_percentage, measurement_date')
              .eq('indicator_id', indicatorId)
              .order('measurement_date', { ascending: false })
              .limit(2);

            if (prevUpdates && prevUpdates.length > 1) {
              previousProgressMap.set(indicatorId, prevUpdates[1].progress_percentage);
            }
          }

          activities.push(
            ...indicatorUpdates.map((update: any) => ({
              id: `indicator-${update.id}`,
              type: 'indicator' as const,
              timestamp: update.created_at,
              projectId: update.project_indicators.projects.id,
              projectName: update.project_indicators.projects.name,
              thesisId: update.project_indicators.projects.thesis_id,
              thesisName: update.project_indicators.projects.strategic_theses?.name || null,
              title: update.project_indicators.name,
              description: `Medição: ${update.measured_value}${update.project_indicators.unit ? ` ${update.project_indicators.unit}` : ''} (${update.progress_percentage}%)`,
              progress: update.progress_percentage,
              previousProgress: previousProgressMap.get(update.indicator_id),
              notes: update.notes,
              unit: update.project_indicators.unit,
              updatedBy: {
                id: update.updated_by,
                name: update.profiles?.full_name || 'Usuário',
                avatar: update.profiles?.avatar_url
              }
            }))
          );
        }
      }

      // Fetch milestone updates
      if (shouldFetch('milestone')) {
        let milestoneQuery = supabase
          .from('project_milestone_updates')
          .select(`
            id,
            progress_percentage,
            is_critical,
            notes,
            updated_at,
            updated_by,
            milestone_id,
            project_milestones!inner (
              title,
              completed,
              project_id,
              projects!inner (
                id,
                name,
                thesis_id,
                strategic_theses (
                  id,
                  name
                )
              )
            ),
            profiles:updated_by (
              full_name,
              avatar_url
            )
          `)
          .gte('updated_at', start)
          .lte('updated_at', end)
          .order('updated_at', { ascending: false });

        if (filters.projectId) {
          milestoneQuery = milestoneQuery.eq('project_milestones.projects.id', filters.projectId);
        }

        if (filters.thesisId) {
          milestoneQuery = milestoneQuery.eq('project_milestones.projects.thesis_id', filters.thesisId);
        }

        const { data: milestoneUpdates } = await milestoneQuery;

        if (milestoneUpdates) {
          const milestoneIds = [...new Set(milestoneUpdates.map(u => u.milestone_id))];
          const previousProgressMap = new Map<string, number>();

          for (const milestoneId of milestoneIds) {
            const { data: prevUpdates } = await supabase
              .from('project_milestone_updates')
              .select('progress_percentage, updated_at')
              .eq('milestone_id', milestoneId)
              .order('updated_at', { ascending: false })
              .limit(2);

            if (prevUpdates && prevUpdates.length > 1) {
              previousProgressMap.set(milestoneId, prevUpdates[1].progress_percentage);
            }
          }

          activities.push(
            ...milestoneUpdates.map((update: any) => ({
              id: `milestone-${update.id}`,
              type: 'milestone' as const,
              timestamp: update.updated_at,
              projectId: update.project_milestones.projects.id,
              projectName: update.project_milestones.projects.name,
              thesisId: update.project_milestones.projects.thesis_id,
              thesisName: update.project_milestones.projects.strategic_theses?.name || null,
              title: update.project_milestones.title,
              description: update.progress_percentage === 100 
                ? '✅ Marco concluído!'
                : `Progresso: ${previousProgressMap.get(update.milestone_id) || 0}% → ${update.progress_percentage}%`,
              progress: update.progress_percentage,
              previousProgress: previousProgressMap.get(update.milestone_id),
              isCritical: update.is_critical,
              notes: update.notes,
              updatedBy: {
                id: update.updated_by,
                name: update.profiles?.full_name || 'Usuário',
                avatar: update.profiles?.avatar_url
              }
            }))
          );
        }
      }

      // Fetch task status changes
      if (shouldFetch('task_status')) {
        const { data: taskStatusChanges } = await supabase
          .from('task_status_history')
          .select(`
            id,
            old_status,
            new_status,
            notes,
            changed_at,
            changed_by,
            task_id,
            project_tasks!inner (
              title,
              project_id,
              projects!inner (
                id,
                name,
                thesis_id,
                strategic_theses (
                  id,
                  name
                )
              )
            ),
            changer:profiles!task_status_history_changed_by_fkey (
              full_name,
              avatar_url
            )
          `)
          .gte('changed_at', start)
          .lte('changed_at', end)
          .order('changed_at', { ascending: false });

        if (taskStatusChanges) {
          const filteredChanges = taskStatusChanges.filter((change: any) => {
            if (filters.projectId && change.project_tasks.projects.id !== filters.projectId) return false;
            if (filters.thesisId && change.project_tasks.projects.thesis_id !== filters.thesisId) return false;
            return true;
          });

          activities.push(
            ...filteredChanges.map((change: any) => ({
              id: `task-status-${change.id}`,
              type: 'task_status' as const,
              timestamp: change.changed_at,
              projectId: change.project_tasks.projects.id,
              projectName: change.project_tasks.projects.name,
              thesisId: change.project_tasks.projects.thesis_id,
              thesisName: change.project_tasks.projects.strategic_theses?.name || null,
              title: change.project_tasks.title,
              description: `${change.old_status || 'Novo'} → ${change.new_status}`,
              notes: change.notes,
              metadata: {
                oldStatus: change.old_status,
                newStatus: change.new_status
              },
              updatedBy: {
                id: change.changed_by,
                name: change.changer?.full_name || 'Usuário',
                avatar: change.changer?.avatar_url
              }
            }))
          );
        }
      }

      // Fetch task date changes
      if (shouldFetch('task_date')) {
        const { data: taskDateChanges } = await supabase
          .from('task_date_history')
          .select(`
            id,
            old_date,
            new_date,
            reason,
            changed_at,
            changed_by,
            task_id,
            project_tasks!inner (
              title,
              project_id,
              projects!inner (
                id,
                name,
                thesis_id,
                strategic_theses (
                  id,
                  name
                )
              )
            ),
            changer:profiles!task_date_history_changed_by_fkey (
              full_name,
              avatar_url
            )
          `)
          .gte('changed_at', start)
          .lte('changed_at', end)
          .order('changed_at', { ascending: false });

        if (taskDateChanges) {
          const filteredChanges = taskDateChanges.filter((change: any) => {
            if (filters.projectId && change.project_tasks.projects.id !== filters.projectId) return false;
            if (filters.thesisId && change.project_tasks.projects.thesis_id !== filters.thesisId) return false;
            return true;
          });

          activities.push(
            ...filteredChanges.map((change: any) => ({
              id: `task-date-${change.id}`,
              type: 'task_date' as const,
              timestamp: change.changed_at,
              projectId: change.project_tasks.projects.id,
              projectName: change.project_tasks.projects.name,
              thesisId: change.project_tasks.projects.thesis_id,
              thesisName: change.project_tasks.projects.strategic_theses?.name || null,
              title: change.project_tasks.title,
              description: `Data alterada: ${change.old_date || 'Sem data'} → ${change.new_date || 'Sem data'}`,
              notes: change.reason,
              metadata: {
                oldDate: change.old_date,
                newDate: change.new_date,
                reason: change.reason
              },
              updatedBy: {
                id: change.changed_by,
                name: change.changer?.full_name || 'Usuário',
                avatar: change.changer?.avatar_url
              }
            }))
          );
        }
      }

      // Fetch milestone date changes
      if (shouldFetch('milestone_date')) {
        const { data: milestoneDateChanges } = await supabase
          .from('milestone_date_history')
          .select(`
            id,
            old_date,
            new_date,
            reason,
            changed_at,
            changed_by,
            milestone_id,
            project_milestones!inner (
              title,
              project_id,
              projects!inner (
                id,
                name,
                thesis_id,
                strategic_theses (
                  id,
                  name
                )
              )
            ),
            changer:profiles!milestone_date_history_changed_by_fkey (
              full_name,
              avatar_url
            )
          `)
          .gte('changed_at', start)
          .lte('changed_at', end)
          .order('changed_at', { ascending: false });

        if (milestoneDateChanges) {
          const filteredChanges = milestoneDateChanges.filter((change: any) => {
            if (filters.projectId && change.project_milestones.projects.id !== filters.projectId) return false;
            if (filters.thesisId && change.project_milestones.projects.thesis_id !== filters.thesisId) return false;
            return true;
          });

          activities.push(
            ...filteredChanges.map((change: any) => ({
              id: `milestone-date-${change.id}`,
              type: 'milestone_date' as const,
              timestamp: change.changed_at,
              projectId: change.project_milestones.projects.id,
              projectName: change.project_milestones.projects.name,
              thesisId: change.project_milestones.projects.thesis_id,
              thesisName: change.project_milestones.projects.strategic_theses?.name || null,
              title: change.project_milestones.title,
              description: `Data alterada: ${change.old_date || 'Sem data'} → ${change.new_date || 'Sem data'}`,
              notes: change.reason,
              metadata: {
                oldDate: change.old_date,
                newDate: change.new_date,
                reason: change.reason
              },
              updatedBy: {
                id: change.changed_by,
                name: change.changer?.full_name || 'Usuário',
                avatar: change.changer?.avatar_url
              }
            }))
          );
        }
      }

      // Fetch project situations
      if (shouldFetch('situation')) {
        const { data: situations } = await supabase
          .from('project_situations')
          .select(`
            id,
            current_problem,
            target_goal,
            created_at,
            created_by,
            project_id,
            projects!inner (
              id,
              name,
              thesis_id,
              strategic_theses (
                id,
                name
              )
            ),
            creator:profiles!project_situations_created_by_fkey (
              full_name,
              avatar_url
            )
          `)
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at', { ascending: false });

        if (situations) {
          const filteredSituations = situations.filter((situation: any) => {
            if (filters.projectId && situation.projects.id !== filters.projectId) return false;
            if (filters.thesisId && situation.projects.thesis_id !== filters.thesisId) return false;
            return true;
          });

          activities.push(
            ...filteredSituations.map((situation: any) => ({
              id: `situation-${situation.id}`,
              type: 'situation' as const,
              timestamp: situation.created_at,
              projectId: situation.projects.id,
              projectName: situation.projects.name,
              thesisId: situation.projects.thesis_id,
              thesisName: situation.projects.strategic_theses?.name || null,
              title: 'Nova situação registrada',
              description: situation.current_problem,
              notes: situation.target_goal,
              updatedBy: {
                id: situation.created_by,
                name: situation.creator?.full_name || 'Usuário',
                avatar: situation.creator?.avatar_url
              }
            }))
          );
        }
      }

      // Fetch project comments
      if (shouldFetch('comment')) {
        const { data: comments } = await supabase
          .from('project_comments')
          .select(`
            id,
            comment,
            created_at,
            user_id,
            project_id,
            projects!inner (
              id,
              name,
              thesis_id,
              strategic_theses (
                id,
                name
              )
            ),
            user:profiles!project_comments_user_id_fkey (
              full_name,
              avatar_url
            )
          `)
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at', { ascending: false });

        if (comments) {
          const filteredComments = comments.filter((comment: any) => {
            if (filters.projectId && comment.projects.id !== filters.projectId) return false;
            if (filters.thesisId && comment.projects.thesis_id !== filters.thesisId) return false;
            return true;
          });

          activities.push(
            ...filteredComments.map((comment: any) => ({
              id: `comment-${comment.id}`,
              type: 'comment' as const,
              timestamp: comment.created_at,
              projectId: comment.projects.id,
              projectName: comment.projects.name,
              thesisId: comment.projects.thesis_id,
              thesisName: comment.projects.strategic_theses?.name || null,
              title: 'Comentário adicionado',
              description: comment.comment,
              updatedBy: {
                id: comment.user_id,
                name: comment.user?.full_name || 'Usuário',
                avatar: comment.user?.avatar_url
              }
            }))
          );
        }
      }

      // Fetch health status changes
      if (shouldFetch('health')) {
        const { data: healthChanges } = await supabase
          .from('project_health_status')
          .select(`
            id,
            health_status,
            reason,
            reported_at,
            reported_by,
            project_id,
            projects!inner (
              id,
              name,
              thesis_id,
              strategic_theses (
                id,
                name
              )
            ),
            reporter:profiles!project_health_status_reported_by_fkey (
              full_name,
              avatar_url
            )
          `)
          .gte('reported_at', start)
          .lte('reported_at', end)
          .order('reported_at', { ascending: false });

        if (healthChanges) {
          const filteredHealth = healthChanges.filter((health: any) => {
            if (filters.projectId && health.projects.id !== filters.projectId) return false;
            if (filters.thesisId && health.projects.thesis_id !== filters.thesisId) return false;
            return true;
          });

          activities.push(
            ...filteredHealth.map((health: any) => ({
              id: `health-${health.id}`,
              type: 'health' as const,
              timestamp: health.reported_at,
              projectId: health.projects.id,
              projectName: health.projects.name,
              thesisId: health.projects.thesis_id,
              thesisName: health.projects.strategic_theses?.name || null,
              title: 'Status de saúde atualizado',
              description: `Status: ${health.health_status}`,
              notes: health.reason,
              metadata: {
                healthStatus: health.health_status as 'green' | 'yellow' | 'red'
              },
              updatedBy: {
                id: health.reported_by,
                name: health.reporter?.full_name || 'Usuário',
                avatar: health.reporter?.avatar_url
              }
            }))
          );
        }
      }

      // Fetch attachments
      if (shouldFetch('attachment')) {
        const { data: attachments } = await supabase
          .from('project_attachments')
          .select(`
            id,
            file_name,
            file_type,
            file_size,
            uploaded_at,
            uploaded_by,
            project_id,
            projects!inner (
              id,
              name,
              thesis_id,
              strategic_theses (
                id,
                name
              )
            ),
            uploader:profiles!project_attachments_uploaded_by_fkey (
              full_name,
              avatar_url
            )
          `)
          .gte('uploaded_at', start)
          .lte('uploaded_at', end)
          .order('uploaded_at', { ascending: false });

        if (attachments) {
          const filteredAttachments = attachments.filter((attachment: any) => {
            if (filters.projectId && attachment.projects.id !== filters.projectId) return false;
            if (filters.thesisId && attachment.projects.thesis_id !== filters.thesisId) return false;
            return true;
          });

          activities.push(
            ...filteredAttachments.map((attachment: any) => ({
              id: `attachment-${attachment.id}`,
              type: 'attachment' as const,
              timestamp: attachment.uploaded_at,
              projectId: attachment.projects.id,
              projectName: attachment.projects.name,
              thesisId: attachment.projects.thesis_id,
              thesisName: attachment.projects.strategic_theses?.name || null,
              title: 'Anexo adicionado',
              description: attachment.file_name,
              metadata: {
                fileName: attachment.file_name,
                fileType: attachment.file_type
              },
              updatedBy: {
                id: attachment.uploaded_by,
                name: attachment.uploader?.full_name || 'Usuário',
                avatar: attachment.uploader?.avatar_url
              }
            }))
          );
        }
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return activities;
    }
  });
}
