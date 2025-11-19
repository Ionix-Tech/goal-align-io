import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfToday, addDays, subDays } from "date-fns";

export interface AttentionItem {
  id: string;
  type: 'task' | 'milestone' | 'indicator' | 'project';
  title: string;
  projectId: string;
  projectName: string;
  thesisId?: string;
  thesisName?: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  status?: string;
  daysOverdue?: number;
  daysRemaining?: number;
  progress?: number;
  healthStatus?: string;
  lastUpdate?: string;
}

export interface AttentionPointsData {
  criticalCount: number;
  warningCount: number;
  monitoringCount: number;
  overdueItems: AttentionItem[];
  dueTodayItems: AttentionItem[];
  dueIn3DaysItems: AttentionItem[];
  projectsAtRisk: AttentionItem[];
  projectsWithoutUpdates: AttentionItem[];
  indicatorsWithoutMeasurement: AttentionItem[];
  longRunningTasks: AttentionItem[];
}

export const useAttentionPoints = () => {
  return useQuery({
    queryKey: ['attention-points'],
    queryFn: async (): Promise<AttentionPointsData> => {
      const today = startOfToday().toISOString().split('T')[0];
      const in3Days = addDays(startOfToday(), 3).toISOString().split('T')[0];
      const thirtyDaysAgo = subDays(startOfToday(), 30).toISOString().split('T')[0];
      const sevenDaysAgo = subDays(startOfToday(), 7).toISOString().split('T')[0];
      const fifteenDaysAgo = subDays(startOfToday(), 15).toISOString().split('T')[0];

      // Fetch overdue tasks
      const { data: overdueTasks } = await supabase
        .from('project_tasks')
        .select(`
          id,
          title,
          due_date,
          status,
          assigned_to,
          project_id,
          projects!inner(name, thesis_id, strategic_theses(name)),
          assigned_profile:profiles!assigned_to(full_name)
        `)
        .lt('due_date', today)
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      // Fetch tasks due today
      const { data: dueTodayTasks } = await supabase
        .from('project_tasks')
        .select(`
          id,
          title,
          due_date,
          status,
          assigned_to,
          project_id,
          projects!inner(name, thesis_id, strategic_theses(name)),
          assigned_profile:profiles!assigned_to(full_name)
        `)
        .eq('due_date', today)
        .neq('status', 'completed');

      // Fetch tasks due in next 3 days
      const { data: dueIn3DaysTasks } = await supabase
        .from('project_tasks')
        .select(`
          id,
          title,
          due_date,
          status,
          assigned_to,
          project_id,
          projects!inner(name, thesis_id, strategic_theses(name)),
          assigned_profile:profiles!assigned_to(full_name)
        `)
        .gt('due_date', today)
        .lte('due_date', in3Days)
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      // Fetch overdue milestones
      const { data: overdueMilestones } = await supabase
        .from('project_milestones')
        .select(`
          id,
          title,
          target_date,
          project_id,
          projects!inner(name, thesis_id, strategic_theses(name))
        `)
        .lt('target_date', today)
        .eq('completed', false)
        .order('target_date', { ascending: true });

      // Fetch milestones due today or in next 3 days
      const { data: upcomingMilestones } = await supabase
        .from('project_milestones')
        .select(`
          id,
          title,
          target_date,
          project_id,
          projects!inner(name, thesis_id, strategic_theses(name))
        `)
        .gte('target_date', today)
        .lte('target_date', in3Days)
        .eq('completed', false)
        .order('target_date', { ascending: true });

      // Fetch projects at risk (with red or yellow health status)
      const { data: projectsAtRisk } = await supabase
        .from('project_health_status')
        .select(`
          project_id,
          health_status,
          reason,
          reported_at,
          projects!inner(id, name, thesis_id, strategic_theses(name))
        `)
        .in('health_status', ['red', 'yellow'])
        .is('resolved_at', null)
        .order('reported_at', { ascending: false });

      // Fetch projects without updates (no indicator/milestone updates in last 7 days)
      const { data: allApprovedProjects } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          thesis_id,
          updated_at,
          strategic_theses(name)
        `)
        .in('status', ['approved', 'review']);

      const projectsWithoutUpdates: any[] = [];
      if (allApprovedProjects) {
        for (const project of allApprovedProjects) {
          const { data: indicatorUpdates } = await supabase
            .from('project_indicator_updates')
            .select('created_at')
            .eq('indicator_id', project.id)
            .gte('created_at', sevenDaysAgo)
            .limit(1);

          const { data: milestoneUpdates } = await supabase
            .from('project_milestone_updates')
            .select('updated_at')
            .gte('updated_at', sevenDaysAgo)
            .limit(1);

          if ((!indicatorUpdates || indicatorUpdates.length === 0) && 
              (!milestoneUpdates || milestoneUpdates.length === 0)) {
            projectsWithoutUpdates.push(project);
          }
        }
      }

      // Fetch indicators without measurement in last 15 days
      const { data: indicators } = await supabase
        .from('project_indicators')
        .select(`
          id,
          name,
          project_id,
          projects!inner(name, thesis_id, strategic_theses(name))
        `);

      const indicatorsWithoutMeasurement: any[] = [];
      if (indicators) {
        for (const indicator of indicators) {
          const { data: recentUpdates } = await supabase
            .from('project_indicator_updates')
            .select('created_at')
            .eq('indicator_id', indicator.id)
            .gte('created_at', fifteenDaysAgo)
            .limit(1);

          if (!recentUpdates || recentUpdates.length === 0) {
            indicatorsWithoutMeasurement.push(indicator);
          }
        }
      }

      // Fetch long-running tasks (in_progress for more than 30 days)
      const { data: longRunningTasks } = await supabase
        .from('project_tasks')
        .select(`
          id,
          title,
          created_at,
          status,
          assigned_to,
          project_id,
          projects!inner(name, thesis_id, strategic_theses(name)),
          assigned_profile:profiles!assigned_to(full_name)
        `)
        .eq('status', 'in_progress')
        .lt('created_at', thirtyDaysAgo);

      // Transform data to AttentionItem format
      const calculateDaysOverdue = (dueDate: string) => {
        const due = new Date(dueDate);
        const now = startOfToday();
        return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      };

      const calculateDaysRemaining = (dueDate: string) => {
        const due = new Date(dueDate);
        const now = startOfToday();
        return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      };

      const overdueItems: AttentionItem[] = [
        ...(overdueTasks || []).map(task => ({
          id: task.id,
          type: 'task' as const,
          title: task.title,
          projectId: task.project_id,
          projectName: task.projects.name,
          thesisId: task.projects.thesis_id,
          thesisName: task.projects.strategic_theses?.name,
          assignedTo: task.assigned_to,
          assignedToName: task.assigned_profile?.full_name,
          dueDate: task.due_date,
          status: task.status,
          daysOverdue: calculateDaysOverdue(task.due_date),
        })),
        ...(overdueMilestones || []).map(milestone => ({
          id: milestone.id,
          type: 'milestone' as const,
          title: milestone.title,
          projectId: milestone.project_id,
          projectName: milestone.projects.name,
          thesisId: milestone.projects.thesis_id,
          thesisName: milestone.projects.strategic_theses?.name,
          dueDate: milestone.target_date,
          daysOverdue: calculateDaysOverdue(milestone.target_date),
        })),
      ].sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0));

      const dueTodayItems: AttentionItem[] = (dueTodayTasks || []).map(task => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        projectId: task.project_id,
        projectName: task.projects.name,
        thesisId: task.projects.thesis_id,
        thesisName: task.projects.strategic_theses?.name,
        assignedTo: task.assigned_to,
        assignedToName: task.assigned_profile?.full_name,
        dueDate: task.due_date,
        status: task.status,
        daysRemaining: 0,
      }));

      const dueIn3DaysItems: AttentionItem[] = [
        ...(dueIn3DaysTasks || []).map(task => ({
          id: task.id,
          type: 'task' as const,
          title: task.title,
          projectId: task.project_id,
          projectName: task.projects.name,
          thesisId: task.projects.thesis_id,
          thesisName: task.projects.strategic_theses?.name,
          assignedTo: task.assigned_to,
          assignedToName: task.assigned_profile?.full_name,
          dueDate: task.due_date,
          status: task.status,
          daysRemaining: calculateDaysRemaining(task.due_date),
        })),
        ...(upcomingMilestones || []).map(milestone => ({
          id: milestone.id,
          type: 'milestone' as const,
          title: milestone.title,
          projectId: milestone.project_id,
          projectName: milestone.projects.name,
          thesisId: milestone.projects.thesis_id,
          thesisName: milestone.projects.strategic_theses?.name,
          dueDate: milestone.target_date,
          daysRemaining: calculateDaysRemaining(milestone.target_date),
        })),
      ].sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

      const projectsAtRiskItems: AttentionItem[] = (projectsAtRisk || []).map(item => ({
        id: item.project_id,
        type: 'project' as const,
        title: item.projects.name,
        projectId: item.project_id,
        projectName: item.projects.name,
        thesisId: item.projects.thesis_id,
        thesisName: item.projects.strategic_theses?.name,
        healthStatus: item.health_status,
        lastUpdate: item.reported_at,
      }));

      const projectsWithoutUpdatesItems: AttentionItem[] = projectsWithoutUpdates.map(project => ({
        id: project.id,
        type: 'project' as const,
        title: project.name,
        projectId: project.id,
        projectName: project.name,
        thesisId: project.thesis_id,
        thesisName: project.strategic_theses?.name,
        lastUpdate: project.updated_at,
      }));

      const indicatorsWithoutMeasurementItems: AttentionItem[] = indicatorsWithoutMeasurement.map(indicator => ({
        id: indicator.id,
        type: 'indicator' as const,
        title: indicator.name,
        projectId: indicator.project_id,
        projectName: indicator.projects.name,
        thesisId: indicator.projects.thesis_id,
        thesisName: indicator.projects.strategic_theses?.name,
      }));

      const longRunningTasksItems: AttentionItem[] = (longRunningTasks || []).map(task => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        projectId: task.project_id,
        projectName: task.projects.name,
        thesisId: task.projects.thesis_id,
        thesisName: task.projects.strategic_theses?.name,
        assignedTo: task.assigned_to,
        assignedToName: task.assigned_profile?.full_name,
        status: task.status,
        daysOverdue: calculateDaysOverdue(task.created_at),
      }));

      return {
        criticalCount: overdueItems.length + projectsAtRiskItems.filter(p => p.healthStatus === 'red').length,
        warningCount: dueTodayItems.length + dueIn3DaysItems.length + projectsAtRiskItems.filter(p => p.healthStatus === 'yellow').length,
        monitoringCount: projectsWithoutUpdatesItems.length + indicatorsWithoutMeasurementItems.length + longRunningTasksItems.length,
        overdueItems,
        dueTodayItems,
        dueIn3DaysItems,
        projectsAtRisk: projectsAtRiskItems,
        projectsWithoutUpdates: projectsWithoutUpdatesItems,
        indicatorsWithoutMeasurement: indicatorsWithoutMeasurementItems,
        longRunningTasks: longRunningTasksItems,
      };
    },
  });
};
