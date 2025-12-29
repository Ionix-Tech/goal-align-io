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

export interface A3Task {
  id: string;
  title: string;
  assigneeName: string | null;
  dueDate: string | null;
  status: string;
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

export interface A3Comment {
  id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface A3ReviewData {
  id: string;
  name: string;
  status: string;
  initiative_type: string;
  created_at: string;
  submitted_for_review_at: string | null;
  approved_at: string | null;
  
  objective: string | null;
  strategicIndicator: string | null;
  category: string | null;
  thesisId: string | null;
  thesisName: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  createdByName: string | null;
  
  requirements: A3Requirement[];
  currentSituationDescription: string | null;
  targetSituationDescription: string | null;
  
  milestones: A3Milestone[];
  whyLinks: A3WhyLink[];
  attachments: A3Attachment[];
  tasks: A3Task[];
  comments: A3Comment[];
  
  indicators: A3Indicator[];
}

export function useA3ReviewData(projectId: string | null) {
  return useQuery({
    queryKey: ['a3-review-data', projectId],
    queryFn: async (): Promise<A3ReviewData | null> => {
      if (!projectId) return null;

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

      if (projectError || !project) return null;

      const { data: requirements } = await supabase
        .from('project_requirements')
        .select('id, code, description, display_order')
        .eq('project_id', projectId)
        .order('display_order');

      const { data: indicators } = await supabase
        .from('project_indicators')
        .select('id, name, unit, current_state, target_state')
        .eq('project_id', projectId);

      const { data: indicatorLinks } = await supabase
        .from('requirement_indicator_links')
        .select('indicator_id, requirement_id');

      const { data: tasks } = await supabase
        .from('project_tasks')
        .select('id, title, due_date, status, assigned_to, assignee:profiles!project_tasks_assigned_to_fkey(full_name)')
        .eq('project_id', projectId);

      const { data: taskLinks } = await supabase
        .from('requirement_task_links')
        .select('task_id, requirement_id');

      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('id, title, description, target_date, milestone_type, completed')
        .eq('project_id', projectId)
        .order('target_date');

      const { data: whyLinks } = await supabase
        .from('project_why_links')
        .select('id, url, label')
        .eq('project_id', projectId);

      const { data: attachments } = await supabase
        .from('project_attachments')
        .select('id, file_name, file_path, file_type, file_size, uploaded_at')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      const { data: comments } = await supabase
        .from('project_comments')
        .select('id, comment, created_at, user_id, author:profiles!project_comments_user_id_fkey(id, full_name, avatar_url)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      const formattedComments: A3Comment[] = (comments || []).map(c => ({
        id: c.id,
        comment: c.comment,
        created_at: c.created_at || '',
        user: {
          id: (c.author as any)?.id || c.user_id,
          full_name: (c.author as any)?.full_name || 'Usuário',
          avatar_url: (c.author as any)?.avatar_url || null
        }
      }));

      const reqCodeMap = new Map<string, string>();
      (requirements || []).forEach(r => reqCodeMap.set(r.id, r.code));

      const indicatorsWithLinks: A3Indicator[] = (indicators || []).map(ind => ({
        ...ind,
        linkedRequirements: (indicatorLinks || [])
          .filter(link => link.indicator_id === ind.id)
          .map(link => reqCodeMap.get(link.requirement_id) || '')
          .filter(Boolean)
      }));

      const tasksWithLinks: A3Task[] = (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        assigneeName: (task.assignee as any)?.full_name || null,
        dueDate: task.due_date,
        status: task.status,
        linkedRequirements: (taskLinks || [])
          .filter(link => link.task_id === task.id)
          .map(link => reqCodeMap.get(link.requirement_id) || '')
          .filter(Boolean)
      }));

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
        tasks: tasksWithLinks,
        comments: formattedComments,
        indicators: indicatorsWithLinks
      };
    },
    enabled: !!projectId
  });
}
