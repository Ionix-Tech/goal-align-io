import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface PortfolioMetrics {
  totalProjects: number;
  projectsByStatus: {
    idea: number;
    draft: number;
    review: number;
    approved: number;
    archived: number;
  };
  criticalProjects: number;
  approvalRate: number;
  completedProjects: number;
  pillarDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  healthDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  attentionRequired: Array<{
    id: string;
    name: string;
    reason: string;
    severity: 'critical' | 'warning';
    status: string;
    lastUpdate?: string;
  }>;
}

const PILLAR_COLORS: Record<string, string> = {
  'operational_efficiency': 'hsl(217, 91%, 60%)',
  'sales_expansion': 'hsl(142, 76%, 45%)',
  'new_business': 'hsl(271, 91%, 65%)',
  'customer_experience': 'hsl(330, 85%, 55%)',
  'digital_transformation': 'hsl(188, 85%, 50%)',
};

const PILLAR_LABELS: Record<string, string> = {
  'operational_efficiency': 'Eficiência Operacional',
  'sales_expansion': 'Expansão de Vendas',
  'new_business': 'Novos Negócios',
  'customer_experience': 'Experiência do Cliente',
  'digital_transformation': 'Transformação Digital',
};

export function usePortfolioMetrics() {
  return useQuery({
    queryKey: ['portfolio-metrics'],
    queryFn: async () => {
      // Fetch all projects with related data
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_health_status(health_status, reported_at),
          project_weekly_updates(submitted_at)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const allProjects = projects || [];
      const now = new Date();

      // Calculate basic metrics
      const totalProjects = allProjects.length;
      
      const projectsByStatus = {
        idea: allProjects.filter(p => p.status === 'idea').length,
        draft: allProjects.filter(p => p.status === 'draft').length,
        review: allProjects.filter(p => p.status === 'review').length,
        approved: allProjects.filter(p => p.status === 'approved').length,
        archived: allProjects.filter(p => p.status === 'archived').length,
      };

      // Approval rate: approved / (approved + archived) if there are any
      const totalProcessed = projectsByStatus.approved + projectsByStatus.archived;
      const approvalRate = totalProcessed > 0 
        ? Math.round((projectsByStatus.approved / totalProcessed) * 100) 
        : 0;

      // Get approved projects with health status
      const approvedProjects = allProjects.filter(p => p.status === 'approved');
      
      // Critical projects (red health status)
      const criticalProjects = approvedProjects.filter(p => {
        const healthRecords = p.project_health_status as any[];
        if (!healthRecords || healthRecords.length === 0) return false;
        const latestHealth = healthRecords.sort((a, b) => 
          new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
        )[0];
        return latestHealth?.health_status === 'red';
      }).length;

      // Completed projects (approved with completed milestones - placeholder for now)
      const completedProjects = 0; // TODO: Calculate based on milestones

      // Pillar distribution
      const pillarCounts: Record<string, number> = {};
      let projectsWithoutPillar = 0;
      
      allProjects.forEach(p => {
        if (p.strategic_pillar) {
          pillarCounts[p.strategic_pillar] = (pillarCounts[p.strategic_pillar] || 0) + 1;
        } else {
          projectsWithoutPillar++;
        }
      });

      const pillarDistribution = Object.entries(pillarCounts).map(([key, value]) => ({
        name: PILLAR_LABELS[key] || key,
        value,
        fill: PILLAR_COLORS[key] || 'hsl(var(--chart-1))',
      }));

      // Add projects without pillar if any exist
      if (projectsWithoutPillar > 0) {
        pillarDistribution.push({
          name: 'Sem Pilar Definido',
          value: projectsWithoutPillar,
          fill: 'hsl(240, 5%, 65%)',
        });
      }

      // Health distribution for approved projects
      const healthCounts = { green: 0, yellow: 0, red: 0, unknown: 0 };
      approvedProjects.forEach(p => {
        const healthRecords = p.project_health_status as any[];
        if (!healthRecords || healthRecords.length === 0) {
          healthCounts.unknown++;
          return;
        }
        const latestHealth = healthRecords.sort((a, b) => 
          new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
        )[0];
        const status = latestHealth?.health_status || 'unknown';
        if (status in healthCounts) {
          healthCounts[status as keyof typeof healthCounts]++;
        } else {
          healthCounts.unknown++;
        }
      });

      const healthDistribution = [
        { name: 'Saudável', value: healthCounts.green, fill: 'hsl(142, 76%, 36%)' },
        { name: 'Atenção', value: healthCounts.yellow, fill: 'hsl(45, 93%, 47%)' },
        { name: 'Crítico', value: healthCounts.red, fill: 'hsl(0, 84%, 60%)' },
        { name: 'Sem Status', value: healthCounts.unknown, fill: 'hsl(var(--muted))' },
      ].filter(item => item.value > 0);

      // Projects requiring attention
      const attentionRequired = allProjects
        .map(p => {
          const reasons: string[] = [];
          let severity: 'critical' | 'warning' = 'warning';

          // Check health status
          const healthRecords = p.project_health_status as any[];
          if (healthRecords && healthRecords.length > 0) {
            const latestHealth = healthRecords.sort((a, b) => 
              new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
            )[0];
            if (latestHealth?.health_status === 'red') {
              reasons.push('Saúde crítica');
              severity = 'critical';
            }
          }

          // Check last update
          const updateRecords = p.project_weekly_updates as any[];
          let daysSinceUpdate = 999;
          if (updateRecords && updateRecords.length > 0) {
            const latestUpdate = updateRecords.sort((a, b) => 
              new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            )[0];
            daysSinceUpdate = differenceInDays(now, new Date(latestUpdate.submitted_at));
          }

          if (daysSinceUpdate > 30) {
            reasons.push(`Sem atualização há ${daysSinceUpdate} dias`);
            if (severity !== 'critical') severity = 'warning';
          }

          // Check if stuck in review
          if (p.status === 'review' && p.submitted_for_review_at) {
            const daysInReview = differenceInDays(now, new Date(p.submitted_for_review_at));
            if (daysInReview > 15) {
              reasons.push(`Em revisão há ${daysInReview} dias`);
              if (severity !== 'critical') severity = 'warning';
            }
          }

          if (reasons.length === 0) return null;

          return {
            id: p.id,
            name: p.name,
            reason: reasons.join(' • '),
            severity,
            status: p.status,
            lastUpdate: updateRecords?.[0]?.submitted_at,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          // Critical first, then by project name
          if (a!.severity === 'critical' && b!.severity !== 'critical') return -1;
          if (a!.severity !== 'critical' && b!.severity === 'critical') return 1;
          return a!.name.localeCompare(b!.name);
        })
        .slice(0, 5) as PortfolioMetrics['attentionRequired'];

      const metrics: PortfolioMetrics = {
        totalProjects,
        projectsByStatus,
        criticalProjects,
        approvalRate,
        completedProjects,
        pillarDistribution,
        healthDistribution,
        attentionRequired,
      };

      return metrics;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
