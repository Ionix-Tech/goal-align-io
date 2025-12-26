-- Create table for KPI measurement history
CREATE TABLE public.thesis_kpi_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_id UUID NOT NULL REFERENCES public.thesis_kpis(id) ON DELETE CASCADE,
  measured_value NUMERIC NOT NULL,
  measurement_date DATE NOT NULL,
  notes TEXT,
  measured_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_thesis_kpi_measurements_kpi_id ON public.thesis_kpi_measurements(kpi_id);
CREATE INDEX idx_thesis_kpi_measurements_date ON public.thesis_kpi_measurements(measurement_date);

-- Enable RLS
ALTER TABLE public.thesis_kpi_measurements ENABLE ROW LEVEL SECURITY;

-- Policies: Same as thesis_kpis - managers can manage, users can view
CREATE POLICY "Managers can manage measurements"
ON public.thesis_kpi_measurements
FOR ALL
USING (
  has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role)
);

CREATE POLICY "Users can view measurements of active theses"
ON public.thesis_kpi_measurements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM thesis_kpis tk
    JOIN strategic_theses st ON st.id = tk.thesis_id
    WHERE tk.id = thesis_kpi_measurements.kpi_id
    AND st.is_active = true
  )
);