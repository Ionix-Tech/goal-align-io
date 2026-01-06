import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WORKLOAD_RULES } from "@/config/workloadRules";

export interface WorkloadMember {
  memberId: string;
  memberName: string;
  email: string;
  totalTasks: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  overdue: number;
  activeTasks: number;
  workloadLevel: "low" | "medium" | "high" | "overloaded";
}

export interface WorkloadData {
  members: WorkloadMember[];
  unassignedTasks: number;
  totalTasks: number;
  overdueTasks: number;
}

// Dynamic function that uses thresholds from settings
function calculateTaskWorkloadLevel(
  activeTasks: number,
  thresholds: { low: number; medium: number; high: number }
): "low" | "medium" | "high" | "overloaded" {
  if (activeTasks <= thresholds.low) return "low";
  if (activeTasks <= thresholds.medium) return "medium";
  if (activeTasks <= thresholds.high) return "high";
  return "overloaded";
}

export function useWorkloadData() {
  return useQuery({
    queryKey: ["workload-data"],
    queryFn: async (): Promise<WorkloadData> => {
      // Fetch settings from database
      const { data: settingsData } = await supabase
        .from("workload_settings")
        .select("setting_key, setting_value");

      // Build thresholds from settings or use defaults
      const settingsMap: Record<string, number> = {};
      for (const row of settingsData || []) {
        settingsMap[row.setting_key] = row.setting_value;
      }

      const taskThresholds = {
        low: settingsMap.tasks_low_max ?? WORKLOAD_RULES.tasks.thresholds.low,
        medium: settingsMap.tasks_medium_max ?? WORKLOAD_RULES.tasks.thresholds.medium,
        high: settingsMap.tasks_high_max ?? WORKLOAD_RULES.tasks.thresholds.high,
      };

      // Get all team members
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (profilesError) throw profilesError;

      // Get all tasks with assignments
      const { data: tasks, error: tasksError } = await supabase
        .from("project_tasks")
        .select("id, assigned_to, status, due_date");

      if (tasksError) throw tasksError;

      const today = new Date().toISOString().split("T")[0];

      // Calculate workload for each member
      const members: WorkloadMember[] = (profiles || []).map((profile) => {
        const memberTasks = (tasks || []).filter(
          (t) => t.assigned_to === profile.id
        );

        const notStarted = memberTasks.filter(
          (t) => t.status === "todo" || t.status === "not_started"
        ).length;
        const inProgress = memberTasks.filter(
          (t) => t.status === "in_progress"
        ).length;
        const completed = memberTasks.filter(
          (t) => t.status === "done" || t.status === "completed"
        ).length;
        const overdue = memberTasks.filter(
          (t) =>
            t.due_date &&
            t.due_date < today &&
            t.status !== "done" &&
            t.status !== "completed"
        ).length;

        const activeTasks = notStarted + inProgress;

        return {
          memberId: profile.id,
          memberName: profile.full_name,
          email: profile.email,
          totalTasks: memberTasks.length,
          notStarted,
          inProgress,
          completed,
          overdue,
          activeTasks,
          workloadLevel: calculateTaskWorkloadLevel(activeTasks, taskThresholds),
        };
      });

      // Calculate unassigned tasks
      const unassignedTasks = (tasks || []).filter(
        (t) => !t.assigned_to && t.status !== "done" && t.status !== "completed"
      ).length;

      // Calculate total overdue
      const overdueTasks = (tasks || []).filter(
        (t) =>
          t.due_date &&
          t.due_date < today &&
          t.status !== "done" &&
          t.status !== "completed"
      ).length;

      return {
        members: members.sort((a, b) => b.activeTasks - a.activeTasks),
        unassignedTasks,
        totalTasks: tasks?.length || 0,
        overdueTasks,
      };
    },
  });
}
