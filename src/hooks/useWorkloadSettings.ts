import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { WORKLOAD_RULES } from "@/config/workloadRules";

export interface WorkloadSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Default values from config (used as fallback)
const defaultSettings: Record<string, number> = {
  tasks_low_max: WORKLOAD_RULES.tasks.thresholds.low,
  tasks_medium_max: WORKLOAD_RULES.tasks.thresholds.medium,
  tasks_high_max: WORKLOAD_RULES.tasks.thresholds.high,
  leadership_overloaded_critical: WORKLOAD_RULES.leadership.thresholds.overloadedCritical,
  leadership_high_critical: WORKLOAD_RULES.leadership.thresholds.highCritical,
  leadership_high_projects: WORKLOAD_RULES.leadership.thresholds.highProjects,
  leadership_medium_critical: WORKLOAD_RULES.leadership.thresholds.mediumCritical,
  leadership_medium_projects: WORKLOAD_RULES.leadership.thresholds.mediumProjects,
};

export function useWorkloadSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["workload-settings"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("workload_settings")
        .select("*");

      if (error) {
        console.error("Error fetching workload settings:", error);
        return defaultSettings;
      }

      // Convert array to record
      const settings: Record<string, number> = { ...defaultSettings };
      for (const row of data || []) {
        settings[row.setting_key] = row.setting_value;
      }

      return settings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { key: string; value: number }[]) => {
      if (!user) throw new Error("Não autenticado");

      for (const update of updates) {
        const { error } = await supabase
          .from("workload_settings")
          .update({
            setting_value: update.value,
            updated_by: user.id,
          })
          .eq("setting_key", update.key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workload-settings"] });
      queryClient.invalidateQueries({ queryKey: ["workload-data"] });
      queryClient.invalidateQueries({ queryKey: ["project-leadership-data"] });
      toast.success("Configurações salvas com sucesso");
    },
    onError: (error) => {
      console.error("Error updating workload settings:", error);
      toast.error("Erro ao salvar configurações");
    },
  });

  return {
    settings: query.data ?? defaultSettings,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

// Hook specifically for reading settings (for use in calculation hooks)
export function useWorkloadSettingsValues() {
  const { settings, isLoading } = useWorkloadSettings();
  
  return {
    isLoading,
    tasks: {
      low: settings.tasks_low_max,
      medium: settings.tasks_medium_max,
      high: settings.tasks_high_max,
    },
    leadership: {
      overloadedCritical: settings.leadership_overloaded_critical,
      highCritical: settings.leadership_high_critical,
      highProjects: settings.leadership_high_projects,
      mediumCritical: settings.leadership_medium_critical,
      mediumProjects: settings.leadership_medium_projects,
    },
  };
}
