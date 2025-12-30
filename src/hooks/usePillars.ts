import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Pillar {
  id: string;
  name: string;
  pillar_type: 'corpo' | 'alma' | 'mente';
  description: string | null;
  color_class: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export function usePillars() {
  return useQuery({
    queryKey: ["pillars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_pillars")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as Pillar[];
    },
  });
}

export function useThesesByPillar(pillarId: string | undefined) {
  return useQuery({
    queryKey: ["theses-by-pillar", pillarId],
    queryFn: async () => {
      if (!pillarId) return [];
      
      const { data, error } = await supabase
        .from("strategic_theses")
        .select("*")
        .eq("pillar_id", pillarId)
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!pillarId,
  });
}
