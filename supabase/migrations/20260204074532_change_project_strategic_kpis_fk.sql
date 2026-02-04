-- Migration: Change project_strategic_kpis FK from thesis_kpis to kpis
-- This allows linking projects to KPIs from the main kpis table (10-EBITDA, 11-EFICIÊNCIA OPERACIONAL, etc.)

-- Clear existing data (incompatible with new FK as IDs reference different table)
DELETE FROM public.project_strategic_kpis;

-- Remove old constraint
ALTER TABLE public.project_strategic_kpis
DROP CONSTRAINT IF EXISTS project_strategic_kpis_kpi_id_fkey;

-- Add new constraint referencing kpis table
ALTER TABLE public.project_strategic_kpis
ADD CONSTRAINT project_strategic_kpis_kpi_id_fkey
FOREIGN KEY (kpi_id) REFERENCES public.kpis(id) ON DELETE CASCADE;
