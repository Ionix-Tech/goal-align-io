import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface A3Requirement {
  id: string;
  code: string;
  description: string;
  display_order: number;
}

export interface A3Indicator {
  id: string;
  name: string;
  unit: string | null;
  current_state: string;
  target_state: string;
  linkedRequirements: string[]; // requirement codes
}

export interface A3Milestone {
  id: string;
  title: string;
  description: string | null;
  target_date: string;
  milestone_type: 'decolagem' | 'voo' | 'escala' | null;
  completed: boolean;
}

export interface A3WhyLink {
  id: string;
  url: string;
  label: string | null;
}

export interface A3Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface A3ReviewData {
  // Basic info
  id: string;
  name: string;
  status: string;
  initiative_type: string;
  created_at: string;
  submitted_for_review_at: string | null;
  approved_at: string | null;
  
  // Context (Step 1)
  objective: string | null;
  strategicIndicator: string | null;
  category: string | null;
  thesisId: string | null;
  thesisName: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  createdByName: string | null;
  
  // Requirements (Step 2)
  requirements: A3Requirement[];
  
  // Diagnosis (Step 3)
  currentSituationDescription: string | null;
  
  // Strategy (Step 4)
  targetSituationDescription: string | null;
  
  // Execution (Step 5)
  milestones: A3Milestone[];
  whyLinks: A3WhyLink[];
  attachments: A3Attachment[];
  
  // Control (Step 6)
  indicators: A3Indicator[];
}

export function useA3ReviewData(projectId: string | null) {
  return useQuery({
    queryKey: ['a3-review-data', projectId],
    queryFn: async (): Promise<A3ReviewData | null> => {
      if (!projectId) return null;

      // 1. Fetch main project data with related entities
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          thesis:strategic_theses(name),
          assignee:profiles!projects_assigned_to_fkey(full_name),
          creator:profiles!projects_created_by_fkey(full_name)
        `)
        .eq('id', projectId)
        .maybeSingle();

      if (projectError || !project) {
        console.error('Error fetching project:', projectError);
        return null;
      }

      // 2. Fetch requirements
      const { data: requirements } = await supabase
        .from('project_requirements')
        .select('id, code, description, display_order')
        .eq('project_id', projectId)
        .order('display_order');

      // 3. Fetch indicators
      const { data: indicators } = await supabase
        .from('project_indicators')
        .select('id, name, unit, current_state, target_state')
        .eq('project_id', projectId);

      // 4. Fetch requirement-indicator links
      const { data: indicatorLinks } = await supabase
        .from('requirement_indicator_links')
        .select('indicator_id, requirement_id');

      // 5. Fetch milestones
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('id, title, description, target_date, milestone_type, completed')
        .eq('project_id', projectId)
        .order('target_date');

      // 6. Fetch why links
      const { data: whyLinks } = await supabase
        .from('project_why_links')
        .select('id, url, label')
        .eq('project_id', projectId);

      // 7. Fetch attachments
      const { data: attachments } = await supabase
        .from('project_attachments')
        .select('id, file_name, file_path, file_type, file_size, uploaded_at')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      // Build requirement code lookup
      const reqCodeMap = new Map<string, string>();
      (requirements || []).forEach(r => reqCodeMap.set(r.id, r.code));

      // Map indicators with their linked requirements
      const indicatorsWithLinks: A3Indicator[] = (indicators || []).map(ind => {
        const links = (indicatorLinks || [])
          .filter(link => link.indicator_id === ind.id)
          .map(link => reqCodeMap.get(link.requirement_id) || '')
          .filter(Boolean);
        
        return {
          ...ind,
          linkedRequirements: links
        };
      });

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        initiative_type: project.initiative_type,
        created_at: project.created_at,
        submitted_for_review_at: project.submitted_for_review_at,
        approved_at: project.approved_at,
        
        objective: project.objective,
        strategicIndicator: project.strategic_indicator,
        category: project.category,
        thesisId: project.thesis_id,
        thesisName: (project.thesis as any)?.name || null,
        assignedTo: project.assigned_to,
        assigneeName: (project.assignee as any)?.full_name || null,
        createdByName: (project.creator as any)?.full_name || null,
        
        requirements: (requirements || []) as A3Requirement[],
        
        currentSituationDescription: project.current_situation_description,
        targetSituationDescription: project.target_situation_description,
        
        milestones: (milestones || []) as A3Milestone[],
        whyLinks: (whyLinks || []) as A3WhyLink[],
        attachments: (attachments || []) as A3Attachment[],
        
        indicators: indicatorsWithLinks
      };
    },
    enabled: !!projectId
  });
}
