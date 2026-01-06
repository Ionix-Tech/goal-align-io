import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectLeaderProject {
  id: string;
  name: string;
  health: "green" | "yellow" | "red" | null;
  progress: number;
  overdueMillestones: number;
}

export interface ProjectLeader {
  leaderId: string;
  leaderName: string;
  email: string;
  totalProjects: number;
  healthy: number;
  attention: number;
  critical: number;
  noStatus: number;
  overdueProjects: number;
  averageProgress: number;
  leadershipLevel: "low" | "medium" | "high" | "overloaded";
  projects: ProjectLeaderProject[];
}

export interface ProjectLeadershipData {
  leaders: ProjectLeader[];
  unassignedProjects: number;
  totalProjects: number;
  criticalProjects: number;
}

function calculateLeadershipLevel(
  totalProjects: number,
  critical: number
): ProjectLeader["leadershipLevel"] {
  if (critical >= 3) return "overloaded";
  if (critical >= 2 || totalProjects > 5) return "high";
  if (totalProjects > 3 || critical >= 1) return "medium";
  return "low";
}

export function useProjectLeadershipData() {
  return useQuery({
    queryKey: ["project-leadership-data"],
    queryFn: async (): Promise<ProjectLeadershipData> => {
      // Get all active projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, assigned_to, status")
        .in("status", ["approved", "review", "draft"]);

      if (projectsError) throw projectsError;

      // Get health status for all projects
      const { data: healthStatuses, error: healthError } = await supabase
        .from("project_health_status")
        .select("project_id, health_status, resolved_at")
        .is("resolved_at", null);

      if (healthError) throw healthError;

      // Get milestones with due dates
      const { data: milestones, error: milestonesError } = await supabase
        .from("project_milestones")
        .select("id, project_id, target_date, completed");

      if (milestonesError) throw milestonesError;

      // Get milestone updates to calculate progress
      const { data: milestoneUpdates, error: updatesError } = await supabase
        .from("project_milestone_updates")
        .select("milestone_id, progress_percentage")
        .order("updated_at", { ascending: false });

      if (updatesError) throw updatesError;

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesError) throw profilesError;

      const today = new Date().toISOString().split("T")[0];

      // Create health status map
      const healthMap = new Map<string, string>();
      (healthStatuses || []).forEach((h) => {
        healthMap.set(h.project_id, h.health_status);
      });

      // Create milestone progress map (latest update per milestone)
      const milestoneProgressMap = new Map<string, number>();
      (milestoneUpdates || []).forEach((u) => {
        if (!milestoneProgressMap.has(u.milestone_id)) {
          milestoneProgressMap.set(u.milestone_id, u.progress_percentage);
        }
      });

      // Calculate project data
      const projectDataMap = new Map<
        string,
        { progress: number; overdueMillestones: number }
      >();

      (projects || []).forEach((project) => {
        const projectMilestones = (milestones || []).filter(
          (m) => m.project_id === project.id
        );

        let totalProgress = 0;
        let overdueCount = 0;

        projectMilestones.forEach((m) => {
          const progress = m.completed
            ? 100
            : milestoneProgressMap.get(m.id) || 0;
          totalProgress += progress;

          if (m.target_date && m.target_date < today && !m.completed) {
            overdueCount++;
          }
        });

        const avgProgress =
          projectMilestones.length > 0
            ? Math.round(totalProgress / projectMilestones.length)
            : 0;

        projectDataMap.set(project.id, {
          progress: avgProgress,
          overdueMillestones: overdueCount,
        });
      });

      // Group projects by leader
      const leaderMap = new Map<string, ProjectLeaderProject[]>();

      (projects || []).forEach((project) => {
        if (project.assigned_to) {
          const existing = leaderMap.get(project.assigned_to) || [];
          const health = healthMap.get(project.id) as
            | "green"
            | "yellow"
            | "red"
            | null;
          const projectData = projectDataMap.get(project.id) || {
            progress: 0,
            overdueMillestones: 0,
          };

          existing.push({
            id: project.id,
            name: project.name,
            health: health || null,
            progress: projectData.progress,
            overdueMillestones: projectData.overdueMillestones,
          });
          leaderMap.set(project.assigned_to, existing);
        }
      });

      // Build leaders array
      const leaders: ProjectLeader[] = [];

      leaderMap.forEach((leaderProjects, leaderId) => {
        const profile = profiles?.find((p) => p.id === leaderId);
        if (!profile) return;

        const healthy = leaderProjects.filter((p) => p.health === "green").length;
        const attention = leaderProjects.filter((p) => p.health === "yellow").length;
        const critical = leaderProjects.filter((p) => p.health === "red").length;
        const noStatus = leaderProjects.filter((p) => !p.health).length;
        const overdueProjects = leaderProjects.filter(
          (p) => p.overdueMillestones > 0
        ).length;

        const avgProgress =
          leaderProjects.length > 0
            ? Math.round(
                leaderProjects.reduce((sum, p) => sum + p.progress, 0) /
                  leaderProjects.length
              )
            : 0;

        leaders.push({
          leaderId,
          leaderName: profile.full_name,
          email: profile.email,
          totalProjects: leaderProjects.length,
          healthy,
          attention,
          critical,
          noStatus,
          overdueProjects,
          averageProgress: avgProgress,
          leadershipLevel: calculateLeadershipLevel(
            leaderProjects.length,
            critical
          ),
          projects: leaderProjects,
        });
      });

      // Calculate totals
      const unassignedProjects = (projects || []).filter(
        (p) => !p.assigned_to
      ).length;

      const criticalProjects = (projects || []).filter(
        (p) => healthMap.get(p.id) === "red"
      ).length;

      return {
        leaders: leaders.sort((a, b) => b.totalProjects - a.totalProjects),
        unassignedProjects,
        totalProjects: projects?.length || 0,
        criticalProjects,
      };
    },
  });
}
