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

      // Buscar KPIs
      const { data: kpis, error: kpisError } = await supabase
        .from('thesis_kpis')
        .select('*')
        .eq('thesis_id', thesisId)
        .order('display_order', { ascending: true });

      if (kpisError) throw kpisError;

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
