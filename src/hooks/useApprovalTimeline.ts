import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthlyApproval {
  month: string;
  monthLabel: string;
  count: number;
  projects: string[];
  changeFromPrevious?: number;
}

export interface ApprovalTimelineData {
  timeline: MonthlyApproval[];
  averagePerMonth: number;
  peakMonth: MonthlyApproval | null;
}

export function useApprovalTimeline() {
  return useQuery({
    queryKey: ['approval-timeline'],
    queryFn: async (): Promise<ApprovalTimelineData> => {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      
      const { data: projects, error } = await supabase
        .from('projects')
        .select('name, approved_at')
        .eq('status', 'approved')
        .gte('approved_at', sixMonthsAgo.toISOString())
        .order('approved_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData = new Map<string, { count: number; projects: string[] }>();
      
      // Initialize all 6 months with 0
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyData.set(monthKey, { count: 0, projects: [] });
      }

      // Fill in actual data
      projects?.forEach(project => {
        if (project.approved_at) {
          const monthKey = format(new Date(project.approved_at), 'yyyy-MM');
          const existing = monthlyData.get(monthKey);
          if (existing) {
            existing.count++;
            existing.projects.push(project.name);
          }
        }
      });

      // Convert to array with labels
      const timeline: MonthlyApproval[] = [];
      let previousCount = 0;

      Array.from(monthlyData.entries()).forEach(([month, data]) => {
        const monthDate = new Date(month + '-01');
        const changeFromPrevious = previousCount > 0 
          ? ((data.count - previousCount) / previousCount) * 100 
          : 0;

        timeline.push({
          month,
          monthLabel: format(monthDate, 'MMM', { locale: ptBR }),
          count: data.count,
          projects: data.projects,
          changeFromPrevious: previousCount > 0 ? changeFromPrevious : undefined,
        });

        previousCount = data.count;
      });

      const totalApprovals = timeline.reduce((sum, item) => sum + item.count, 0);
      const averagePerMonth = timeline.length > 0 ? totalApprovals / timeline.length : 0;

      const peakMonth = timeline.reduce((max, item) => 
        item.count > (max?.count || 0) ? item : max
      , timeline[0] || null);

      return {
        timeline,
        averagePerMonth,
        peakMonth,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
