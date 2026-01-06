import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  initiative_type: string;
}

export interface ThesisKPISummary {
  id: string;
  name: string;
  current_value: number | null;
  target_value: number;
  unit: string | null;
}

export interface ThesisAlignment {
  id: string;
  name: string;
  objective: string;
  thesis_type: string;
  projects: ProjectSummary[];
  kpis: ThesisKPISummary[];
  projectCount: number;
  kpiCount: number;
  status: 'covered' | 'partial' | 'gap';
  coverageScore: number;
}

export interface PillarAlignment {
  id: string;
  name: string;
  pillar_type: string;
  color_class: string | null;
  icon: string | null;
  theses: ThesisAlignment[];
  projectCount: number;
  thesisCount: number;
  coverage: number;
}

export interface StrategicGap {
  id: string;
  type: 'no_projects' | 'no_kpis' | 'low_coverage';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  relatedId: string;
  relatedName: string;
}

export interface StrategicAlignmentMetrics {
  totalTheses: number;
  coveredTheses: number;
  thesesWithKPIs: number;
  totalProjects: number;
  averageProjectsPerThesis: number;
  coverageScore: number;
}

export interface StrategicAlignmentData {
  pillars: PillarAlignment[];
  gaps: StrategicGap[];
  metrics: StrategicAlignmentMetrics;
  isLoading: boolean;
}

function calculateThesisCoverage(projectCount: number, kpiCount: number, hasApprovedProject: boolean): number {
  let score = 0;
  
  if (hasApprovedProject) {
    score += 50;
  } else if (projectCount > 0) {
    score += 25;
  }
  
  if (kpiCount > 0) {
    score += 50;
  }
  
  return score;
}

function getThesisStatus(coverageScore: number): 'covered' | 'partial' | 'gap' {
  if (coverageScore >= 75) return 'covered';
  if (coverageScore >= 25) return 'partial';
  return 'gap';
}

export function useStrategicAlignment() {
  return useQuery({
    queryKey: ['strategic-alignment'],
    queryFn: async (): Promise<StrategicAlignmentData> => {
      // Fetch pillars
      const { data: pillarsData, error: pillarsError } = await supabase
        .from('strategic_pillars')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (pillarsError) throw pillarsError;

      // Fetch theses with their projects and KPIs
      const { data: thesesData, error: thesesError } = await supabase
        .from('strategic_theses')
        .select(`
          *,
          pillar:strategic_pillars(id, name, pillar_type)
        `)
        .eq('is_active', true)
        .eq('is_archived', false);

      if (thesesError) throw thesesError;

      // Fetch projects linked to theses
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, initiative_type, thesis_id')
        .not('thesis_id', 'is', null)
        .neq('status', 'archived');

      if (projectsError) throw projectsError;

      // Fetch KPIs for all theses
      const thesisIds = thesesData?.map(t => t.id) || [];
      const { data: kpisData, error: kpisError } = await supabase
        .from('thesis_kpis')
        .select('id, name, current_value, target_value, unit, thesis_id')
        .in('thesis_id', thesisIds.length > 0 ? thesisIds : ['none']);

      if (kpisError) throw kpisError;

      // Group projects by thesis_id
      const projectsByThesis = new Map<string, ProjectSummary[]>();
      (projectsData || []).forEach(project => {
        if (project.thesis_id) {
          const existing = projectsByThesis.get(project.thesis_id) || [];
          existing.push({
            id: project.id,
            name: project.name,
            status: project.status,
            initiative_type: project.initiative_type,
          });
          projectsByThesis.set(project.thesis_id, existing);
        }
      });

      // Group KPIs by thesis_id
      const kpisByThesis = new Map<string, ThesisKPISummary[]>();
      (kpisData || []).forEach(kpi => {
        const existing = kpisByThesis.get(kpi.thesis_id) || [];
        existing.push({
          id: kpi.id,
          name: kpi.name,
          current_value: kpi.current_value,
          target_value: kpi.target_value,
          unit: kpi.unit,
        });
        kpisByThesis.set(kpi.thesis_id, existing);
      });

      // Build thesis alignments
      const thesisAlignments: ThesisAlignment[] = (thesesData || []).map(thesis => {
        const projects = projectsByThesis.get(thesis.id) || [];
        const kpis = kpisByThesis.get(thesis.id) || [];
        const hasApprovedProject = projects.some(p => p.status === 'approved' || p.status === 'completed');
        const coverageScore = calculateThesisCoverage(projects.length, kpis.length, hasApprovedProject);
        
        return {
          id: thesis.id,
          name: thesis.name,
          objective: thesis.objective,
          thesis_type: thesis.thesis_type,
          projects,
          kpis,
          projectCount: projects.length,
          kpiCount: kpis.length,
          status: getThesisStatus(coverageScore),
          coverageScore,
          pillar_id: thesis.pillar_id,
        };
      });

      // Group theses by pillar
      const thesesByPillar = new Map<string, ThesisAlignment[]>();
      thesisAlignments.forEach(thesis => {
        const pillarId = (thesis as any).pillar_id;
        if (pillarId) {
          const existing = thesesByPillar.get(pillarId) || [];
          existing.push(thesis);
          thesesByPillar.set(pillarId, existing);
        }
      });

      // Build pillar alignments
      const pillarAlignments: PillarAlignment[] = (pillarsData || []).map(pillar => {
        const theses = thesesByPillar.get(pillar.id) || [];
        const projectCount = theses.reduce((sum, t) => sum + t.projectCount, 0);
        const avgCoverage = theses.length > 0 
          ? theses.reduce((sum, t) => sum + t.coverageScore, 0) / theses.length 
          : 0;

        return {
          id: pillar.id,
          name: pillar.name,
          pillar_type: pillar.pillar_type,
          color_class: pillar.color_class,
          icon: pillar.icon,
          theses,
          projectCount,
          thesisCount: theses.length,
          coverage: Math.round(avgCoverage),
        };
      });

      // Identify gaps
      const gaps: StrategicGap[] = [];
      
      thesisAlignments.forEach(thesis => {
        if (thesis.projectCount === 0) {
          gaps.push({
            id: `gap-no-projects-${thesis.id}`,
            type: 'no_projects',
            severity: 'critical',
            title: 'Tese sem projetos',
            message: `A tese "${thesis.name}" não possui nenhum projeto vinculado.`,
            relatedId: thesis.id,
            relatedName: thesis.name,
          });
        }
        
        if (thesis.kpiCount === 0) {
          gaps.push({
            id: `gap-no-kpis-${thesis.id}`,
            type: 'no_kpis',
            severity: 'warning',
            title: 'Tese sem KPIs',
            message: `A tese "${thesis.name}" não possui indicadores de sucesso definidos.`,
            relatedId: thesis.id,
            relatedName: thesis.name,
          });
        }
      });

      pillarAlignments.forEach(pillar => {
        if (pillar.thesisCount === 0) {
          gaps.push({
            id: `gap-no-thesis-${pillar.id}`,
            type: 'low_coverage',
            severity: 'info',
            title: 'Pilar sem teses',
            message: `O pilar "${pillar.name}" não possui teses estratégicas definidas.`,
            relatedId: pillar.id,
            relatedName: pillar.name,
          });
        }
      });

      // Sort gaps by severity
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      // Calculate metrics
      const totalTheses = thesisAlignments.length;
      const coveredTheses = thesisAlignments.filter(t => t.status === 'covered').length;
      const thesesWithKPIs = thesisAlignments.filter(t => t.kpiCount > 0).length;
      const totalProjects = projectsData?.length || 0;
      const averageProjectsPerThesis = totalTheses > 0 ? totalProjects / totalTheses : 0;
      const coverageScore = totalTheses > 0 
        ? Math.round(thesisAlignments.reduce((sum, t) => sum + t.coverageScore, 0) / totalTheses)
        : 0;

      return {
        pillars: pillarAlignments,
        gaps,
        metrics: {
          totalTheses,
          coveredTheses,
          thesesWithKPIs,
          totalProjects,
          averageProjectsPerThesis: Math.round(averageProjectsPerThesis * 10) / 10,
          coverageScore,
        },
        isLoading: false,
      };
    },
  });
}
