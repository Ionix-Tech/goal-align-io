-- Add display_format and ytd_mode to kpis table
-- display_format: 'percentage' shows achievement %, 'absolute' shows raw value with unit
-- ytd_mode: 'accumulated' sums values, 'average' averages them

ALTER TABLE public.kpis
  ADD COLUMN IF NOT EXISTS display_format TEXT NOT NULL DEFAULT 'percentage'
    CHECK (display_format IN ('percentage', 'absolute')),
  ADD COLUMN IF NOT EXISTS ytd_mode TEXT NOT NULL DEFAULT 'accumulated'
    CHECK (ytd_mode IN ('accumulated', 'average'));
