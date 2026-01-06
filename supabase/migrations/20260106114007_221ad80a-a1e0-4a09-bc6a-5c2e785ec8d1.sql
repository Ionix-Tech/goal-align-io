-- Create table for workload settings
CREATE TABLE public.workload_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value integer NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.workload_settings ENABLE ROW LEVEL SECURITY;

-- Only managers can manage settings
CREATE POLICY "Managers can manage workload settings"
ON public.workload_settings
FOR ALL
USING (has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role));

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view workload settings"
ON public.workload_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default values
INSERT INTO public.workload_settings (setting_key, setting_value, description) VALUES
-- Task thresholds
('tasks_low_max', 5, 'Máximo de tarefas ativas para carga baixa'),
('tasks_medium_max', 10, 'Máximo de tarefas ativas para carga média'),
('tasks_high_max', 15, 'Máximo de tarefas ativas para carga alta'),
-- Leadership thresholds
('leadership_overloaded_critical', 3, 'Mínimo de projetos críticos para sobrecarregado'),
('leadership_high_critical', 2, 'Mínimo de projetos críticos para carga alta'),
('leadership_high_projects', 5, 'Máximo de projetos para carga alta'),
('leadership_medium_critical', 1, 'Mínimo de projetos críticos para carga média'),
('leadership_medium_projects', 3, 'Máximo de projetos para carga média');

-- Create trigger for updated_at
CREATE TRIGGER update_workload_settings_updated_at
BEFORE UPDATE ON public.workload_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();