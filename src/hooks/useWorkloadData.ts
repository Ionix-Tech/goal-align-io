import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

function calculateWorkloadLevel(activeTasks: number): WorkloadMember["workloadLevel"] {
  if (activeTasks <= 5) return "low";
  if (activeTasks <= 10) return "medium";
  if (activeTasks <= 15) return "high";
  return "overloaded";
}

export function useWorkloadData() {
  return useQuery({
    queryKey: ["workload-data"],
    queryFn: async (): Promise<WorkloadData> => {
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
          workloadLevel: calculateWorkloadLevel(activeTasks),
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
