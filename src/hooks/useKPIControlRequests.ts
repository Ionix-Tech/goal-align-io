import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type KPIRequestStatus = 'submitted' | 'validating_pmo' | 'awaiting_area' | 'approved' | 'returned' | 'rejected';

export interface KPIControlRequest {
  id: string;
  project_id: string;
  requested_by: string;
  suggested_name: string;
  context_type: 'area' | 'strategic';
  area_id: string | null;
  unit: string;
  direction: 'higher_better' | 'lower_better';
  target_type: 'fixed' | 'variable';
  suggested_owner_id: string | null;
  justification: string;
  status: KPIRequestStatus;
  validated_by: string | null;
  validated_at: string | null;
  area_validated_by: string | null;
  area_validated_at: string | null;
  rejection_reason: string | null;
  created_kpi_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  project?: { id: string; name: string };
  requester?: { id: string; full_name: string; email: string };
  area?: { id: string; name: string; code: string };
  suggested_owner?: { id: string; full_name: string };
  validator?: { id: string; full_name: string };
  created_kpi?: { id: string; name: string };
}

export function useKPIControlRequests(filters?: { project_id?: string; status?: KPIRequestStatus }) {
  return useQuery({
    queryKey: ['kpi-control-requests', filters],
    queryFn: async () => {
      let query = supabase
        .from('kpi_control_requests')
        .select(`
          *,
          project:projects(id, name),
          requester:profiles!kpi_control_requests_requested_by_fkey(id, full_name, email),
          area:areas(id, name, code),
          suggested_owner:profiles!kpi_control_requests_suggested_owner_id_fkey(id, full_name),
          validator:profiles!kpi_control_requests_validated_by_fkey(id, full_name),
          created_kpi:kpis(id, name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KPIControlRequest[];
    }
  });
}

export interface CreateKPIControlRequestInput {
  project_id: string;
  suggested_name: string;
  context_type: 'area' | 'strategic';
  area_id?: string;
  unit: string;
  direction: 'higher_better' | 'lower_better';
  target_type: 'fixed' | 'variable';
  suggested_owner_id?: string;
  justification: string;
}

export function useCreateKPIControlRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: CreateKPIControlRequestInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('kpi_control_requests')
        .insert({
          ...request,
          requested_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kpi-control-requests'] });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de KPI de Controle foi enviada para análise."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateKPIControlRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KPIControlRequest> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updateData: Record<string, any> = { ...updates };
      
      // If status is changing to validating_pmo or approved, set validator
      if (updates.status === 'validating_pmo' || updates.status === 'approved' || updates.status === 'rejected' || updates.status === 'returned') {
        updateData.validated_by = user.id;
        updateData.validated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('kpi_control_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-control-requests'] });
      toast({
        title: "Solicitação atualizada",
        description: "O status da solicitação foi atualizado."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar solicitação",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useApproveKPIControlRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ request, year }: { request: KPIControlRequest; year: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create the KPI
      const { data: kpi, error: kpiError } = await supabase
        .from('kpis')
        .insert({
          name: request.suggested_name,
          kpi_type: 'control',
          context_type: request.context_type,
          area_id: request.area_id,
          unit: request.unit,
          direction: request.direction,
          target_type: request.target_type,
          owner_id: request.suggested_owner_id || user.id,
          year,
          created_by: user.id
        })
        .select()
        .single();

      if (kpiError) throw kpiError;

      // Update the request with approved status and created_kpi_id
      const { error: updateError } = await supabase
        .from('kpi_control_requests')
        .update({
          status: 'approved',
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          created_kpi_id: kpi.id
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Link the KPI to the project
      const { error: linkError } = await supabase
        .from('project_kpi_links')
        .insert({
          project_id: request.project_id,
          kpi_id: kpi.id,
          linked_by: user.id
        });

      if (linkError) throw linkError;

      return kpi;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-control-requests'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['project-kpi-links'] });
      toast({
        title: "KPI aprovado e criado",
        description: "O KPI de Controle foi criado e vinculado ao projeto."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao aprovar solicitação",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
