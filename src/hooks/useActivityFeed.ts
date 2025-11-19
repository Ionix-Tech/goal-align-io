import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, startOfMonth, subMonths, parseISO } from 'date-fns';

export interface ActivityFeedFilters {
  period: 'week' | 'month' | 'quarter' | 'custom';
  startDate?: string;
  endDate?: string;
  activityType: 'all' | 'indicator' | 'milestone';
  projectId?: string;
  thesisId?: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'indicator' | 'milestone';
  timestamp: string;
  projectId: string;
  projectName: string;
  thesisId: string | null;
  thesisName: string | null;
  title: string;
  description: string;
  progress: number;
  previousProgress?: number;
  isCritical?: boolean;
  notes?: string;
  unit?: string;
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

      // Fetch indicator updates
      if (filters.activityType === 'all' || filters.activityType === 'indicator') {
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

        const { data: indicatorUpdates, error: indicatorError } = await indicatorQuery;

        if (indicatorError) throw indicatorError;

        if (indicatorUpdates) {
          // Get previous progress for each indicator
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
      if (filters.activityType === 'all' || filters.activityType === 'milestone') {
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

        const { data: milestoneUpdates, error: milestoneError } = await milestoneQuery;

        if (milestoneError) throw milestoneError;

        if (milestoneUpdates) {
          // Get previous progress for each milestone
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

      // Sort all activities by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return activities;
    }
  });
}
