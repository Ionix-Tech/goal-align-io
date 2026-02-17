import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Thesis } from './useTheses';

export interface ThesisKPI {
  id: string;
  thesis_id: string;
  name: string;
  description: string | null;
  current_value: number | null;
  target_value: number;
  unit: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ThesisTemplateField {
  id: string;
  thesis_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  field_value: string | null;
  options: any;
  display_order: number;
  created_at: string;
}

export interface ThesisDetails extends Thesis {
  kpis: ThesisKPI[];
  template_fields: ThesisTemplateField[];
  project_count?: number;
}

export function useThesisDetails(thesisId: string | undefined) {
  return useQuery({
    queryKey: ['thesis-details', thesisId],
    queryFn: async () => {
      if (!thesisId) return null;

      // Buscar tese
      const { data: thesis, error: thesisError } = await supabase
        .from('strategic_theses')
        .select(`
          *,
          created_by_profile:profiles!strategic_theses_created_by_fkey(full_name, avatar_url)
        `)
        .eq('id', thesisId)
        .single();

      if (thesisError) throw thesisError;

      // Buscar KPIs do sistema legado (thesis_kpis)
      const { data: legacyKpis, error: legacyKpisError } = await supabase
        .from('thesis_kpis')
        .select('*')
        .eq('thesis_id', thesisId)
        .order('display_order', { ascending: true });

      if (legacyKpisError) throw legacyKpisError;

      // Buscar KPIs do sistema novo (tabela kpis com objective_id)
      const { data: newKpis, error: newKpisError } = await supabase
        .from('kpis')
        .select('*, monthly_values:kpi_monthly_values(*)')
        .eq('objective_id', thesisId)
        .eq('is_active', true)
        .order('name');

      if (newKpisError) throw newKpisError;

      // Converter KPIs novos para o formato ThesisKPI
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const convertedNewKpis: ThesisKPI[] = (newKpis || []).map((nk: any) => {
        const monthlyValues = (nk.monthly_values || []) as any[];
        const sorted = monthlyValues
          .filter((v: any) => v.year === currentYear)
          .sort((a: any, b: any) => b.month - a.month);
        const latestActual = sorted.find((v: any) => v.actual_value !== null);
        const currentMonthVal = sorted.find((v: any) => v.month === currentMonth);
        const latestTarget = sorted.find((v: any) => v.target_value !== null);

        return {
          id: nk.id,
          thesis_id: thesisId,
          name: nk.name,
          description: nk.description,
          current_value: latestActual?.actual_value ?? null,
          target_value: currentMonthVal?.target_value ?? latestTarget?.target_value ?? nk.default_target ?? 0,
          unit: nk.unit,
          display_order: 0,
          created_at: nk.created_at,
          updated_at: nk.updated_at,
        };
      });

      const kpis = [...(legacyKpis || []), ...convertedNewKpis];

      // Buscar template fields
      const { data: templateFields, error: fieldsError } = await supabase
        .from('thesis_template_fields')
        .select('*')
        .eq('thesis_id', thesisId)
        .order('display_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // Contar projetos vinculados
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('thesis_id', thesisId);

      return {
        ...thesis,
        kpis: kpis || [],
        template_fields: templateFields || [],
        project_count: count || 0
      } as ThesisDetails;
    },
    enabled: !!thesisId
  });
}
