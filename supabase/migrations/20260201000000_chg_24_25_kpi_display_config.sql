-- CHG-24: Add display_format to project_indicators (percentage or absolute)
-- CHG-25: Add ytd_mode to project_indicators (accumulated or average)

ALTER TABLE public.project_indicators
  ADD COLUMN IF NOT EXISTS display_format TEXT NOT NULL DEFAULT 'percentage'
    CHECK (display_format IN ('percentage', 'absolute')),
  ADD COLUMN IF NOT EXISTS ytd_mode TEXT NOT NULL DEFAULT 'accumulated'
    CHECK (ytd_mode IN ('accumulated', 'average'));

-- Also add to thesis_kpis for consistency
ALTER TABLE public.thesis_kpis
  ADD COLUMN IF NOT EXISTS display_format TEXT NOT NULL DEFAULT 'percentage'
    CHECK (display_format IN ('percentage', 'absolute')),
  ADD COLUMN IF NOT EXISTS ytd_mode TEXT NOT NULL DEFAULT 'accumulated'
    CHECK (ytd_mode IN ('accumulated', 'average'));
