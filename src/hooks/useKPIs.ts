import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type KPIType = 'strategic' | 'area' | 'control';
export type KPIDirection = 'higher_better' | 'lower_better';
export type KPITargetType = 'fixed' | 'variable';
export type KPIStatus = 'green' | 'yellow' | 'red';

export interface KPI {
  id: string;
  name: string;
  description: string | null;
  kpi_type: KPIType;
  pillar_id: string | null;
  objective_id: string | null;
  parent_kpi_id: string | null;
  area_id: string | null;
  context_type: 'area' | 'strategic' | null;
  unit: string;
  direction: KPIDirection;
  target_type: KPITargetType;
  default_target: number | null;
  owner_id: string;
  year: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  pillar?: { id: string; name: string } | null;
  objective?: { id: string; name: string; objective: string } | null;
  parent_kpi?: { id: string; name: string } | null;
  area?: { id: string; name: string; code: string } | null;
  owner?: { id: string; full_name: string; email: string } | null;
  monthly_values?: KPIMonthlyValue[];
  project_links?: { project_id: string; project_name: string }[];
}

export interface KPIMonthlyValue {
  id: string;
  kpi_id: string;
  year: number;
  month: number;
  target_value: number | null;
  actual_value: number | null;
  status: KPIStatus | null;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface KPIFilters {
  year?: number;
  kpi_type?: KPIType;
  pillar_id?: string;
  objective_id?: string;
  area_id?: string;
  owner_id?: string;
  status?: KPIStatus;
}

export function useKPIs(filters?: KPIFilters) {
  return useQuery({
    queryKey: ['kpis', filters],
    queryFn: async () => {
      let query = supabase
        .from('kpis')
        .select(`
          *,
          pillar:strategic_pillars(id, name),
          objective:strategic_theses(id, name, objective),
          area:areas(id, name, code),
          owner:profiles!kpis_owner_id_fkey(id, full_name, email),
          monthly_values:kpi_monthly_values(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (filters?.year) {
        query = query.eq('year', filters.year);
      }
      if (filters?.kpi_type) {
        query = query.eq('kpi_type', filters.kpi_type);
      }
      if (filters?.pillar_id) {
        query = query.eq('pillar_id', filters.pillar_id);
      }
      if (filters?.objective_id) {
        query = query.eq('objective_id', filters.objective_id);
      }
      if (filters?.area_id) {
        query = query.eq('area_id', filters.area_id);
      }
      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Cast and sort monthly values by month
      return (data as unknown as KPI[]).map(kpi => ({
        ...kpi,
        monthly_values: kpi.monthly_values?.sort((a, b) => a.month - b.month) || []
      }));
    },
    enabled: filters !== undefined
  });
}

export function useKPIDetails(kpiId: string | undefined) {
  return useQuery({
    queryKey: ['kpi-details', kpiId],
    queryFn: async () => {
      if (!kpiId) return null;

      const { data, error } = await supabase
        .from('kpis')
        .select(`
          *,
          pillar:strategic_pillars(id, name),
          objective:strategic_theses(id, name, objective),
          area:areas(id, name, code),
          owner:profiles!kpis_owner_id_fkey(id, full_name, email),
          monthly_values:kpi_monthly_values(*)
        `)
        .eq('id', kpiId)
        .single();

      if (error) throw error;

      // Get project links
      const { data: links } = await supabase
        .from('project_kpi_links')
        .select(`
          project_id,
          project:projects(id, name)
        `)
        .eq('kpi_id', kpiId);

      // Get parent KPI if exists
      let parentKpi = null;
      if (data.parent_kpi_id) {
        const { data: parent } = await supabase
          .from('kpis')
          .select('id, name')
          .eq('id', data.parent_kpi_id)
          .single();
        parentKpi = parent;
      }

      const kpi = data as unknown as KPI;
      kpi.parent_kpi = parentKpi;
      kpi.monthly_values = kpi.monthly_values?.sort((a, b) => a.month - b.month) || [];
      kpi.project_links = links?.map(l => ({
        project_id: l.project_id,
        project_name: (l.project as any)?.name || 'Projeto'
      })) || [];

      return kpi;
    },
    enabled: !!kpiId
  });
}

export interface CreateKPIInput {
  name: string;
  description?: string;
  kpi_type: KPIType;
  pillar_id?: string;
  objective_id?: string;
  parent_kpi_id?: string;
  area_id?: string;
  context_type?: 'area' | 'strategic';
  unit: string;
  direction: KPIDirection;
  target_type: KPITargetType;
  default_target?: number;
  owner_id: string;
  year: number;
}

export function useCreateKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (kpi: CreateKPIInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('kpis')
        .insert({
          ...kpi,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast({
        title: "KPI criado",
        description: "O indicador foi criado e a grade mensal foi gerada automaticamente."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar KPI",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateKPIInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('kpis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-details', variables.id] });
      toast({
        title: "KPI atualizado",
        description: "As alterações foram salvas."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar KPI",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useDeleteKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kpis')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast({
        title: "KPI removido",
        description: "O indicador foi desativado."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover KPI",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
