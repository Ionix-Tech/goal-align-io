import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  name: string;
  count: number;
  fill: string;
  conversionRate?: number;
}

export interface PipelineMetrics {
  stages: PipelineStage[];
  totalProjects: number;
  overallConversionRate: number;
}

export function usePipelineMetrics() {
  return useQuery({
    queryKey: ['pipeline-metrics'],
    queryFn: async (): Promise<PipelineMetrics> => {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('status');

      if (error) throw error;

      // Count projects by status
      const statusCounts = {
        idea: projects?.filter(p => p.status === 'idea').length || 0,
        draft: projects?.filter(p => p.status === 'draft').length || 0,
        review: projects?.filter(p => p.status === 'review').length || 0,
        approved: projects?.filter(p => p.status === 'approved').length || 0,
        archived: projects?.filter(p => p.status === 'archived').length || 0,
      };

      const totalProjects = projects?.length || 0;
      const completedReview = statusCounts.approved + statusCounts.archived;

      // Calculate conversion rates
      const ideaToDraft = statusCounts.idea > 0 
        ? ((statusCounts.draft + statusCounts.review + completedReview) / (statusCounts.idea + statusCounts.draft + statusCounts.review + completedReview)) * 100 
        : 0;
      
      const draftToReview = (statusCounts.draft + statusCounts.review + completedReview) > 0
        ? ((statusCounts.review + completedReview) / (statusCounts.draft + statusCounts.review + completedReview)) * 100
        : 0;
      
      const reviewToDecision = (statusCounts.review + completedReview) > 0
        ? (completedReview / (statusCounts.review + completedReview)) * 100
        : 0;

      const approvalRate = completedReview > 0
        ? (statusCounts.approved / completedReview) * 100
        : 0;

      const overallConversionRate = totalProjects > 0
        ? (statusCounts.approved / totalProjects) * 100
        : 0;

      const stages: PipelineStage[] = [
        {
          name: 'Ideias',
          count: statusCounts.idea,
          fill: 'hsl(var(--primary))',
          conversionRate: ideaToDraft,
        },
        {
          name: 'Detalhamento',
          count: statusCounts.draft,
          fill: 'hsl(220, 90%, 56%)',
          conversionRate: draftToReview,
        },
        {
          name: 'Em Análise',
          count: statusCounts.review,
          fill: 'hsl(45, 93%, 47%)',
          conversionRate: reviewToDecision,
        },
        {
          name: 'Aprovados',
          count: statusCounts.approved,
          fill: 'hsl(142, 76%, 36%)',
          conversionRate: approvalRate,
        },
      ];

      return {
        stages,
        totalProjects,
        overallConversionRate,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
