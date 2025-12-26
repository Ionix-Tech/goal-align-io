import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ThesisKPIMeasurement {
  id: string;
  kpi_id: string;
  measured_value: number;
  measurement_date: string;
  notes: string | null;
  measured_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export function useThesisKPIMeasurements(kpiId: string | undefined) {
  return useQuery({
    queryKey: ['thesis-kpi-measurements', kpiId],
    queryFn: async () => {
      if (!kpiId) return [];
      
      const { data, error } = await supabase
        .from('thesis_kpi_measurements')
        .select(`
          *,
          profiles:measured_by(full_name)
        `)
        .eq('kpi_id', kpiId)
        .order('measurement_date', { ascending: true });

      if (error) throw error;
      return data as ThesisKPIMeasurement[];
    },
    enabled: !!kpiId,
  });
}

export function useAddThesisKPIMeasurement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (measurement: {
      kpi_id: string;
      measured_value: number;
      measurement_date: string;
      notes?: string | null;
      thesis_id: string; // For query invalidation
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Insert the measurement
      const { data, error } = await supabase
        .from('thesis_kpi_measurements')
        .insert({
          kpi_id: measurement.kpi_id,
          measured_value: measurement.measured_value,
          measurement_date: measurement.measurement_date,
          notes: measurement.notes || null,
          measured_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the current_value in thesis_kpis
      const { error: updateError } = await supabase
        .from('thesis_kpis')
        .update({ current_value: measurement.measured_value })
        .eq('id', measurement.kpi_id);

      if (updateError) throw updateError;

      return { data, thesis_id: measurement.thesis_id };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['thesis-kpi-measurements', variables.kpi_id] });
      queryClient.invalidateQueries({ queryKey: ['thesis-details', variables.thesis_id] });
      toast({
        title: "Medição registrada",
        description: "A medição foi adicionada e o valor atual foi atualizado."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar medição",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
