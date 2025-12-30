-- Criar enum para tipos de pilar
CREATE TYPE public.pillar_type AS ENUM ('corpo', 'alma', 'mente');

-- Criar tabela de pilares estratégicos
CREATE TABLE public.strategic_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pillar_type pillar_type NOT NULL UNIQUE,
  description text,
  color_class text,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.strategic_pillars ENABLE ROW LEVEL SECURITY;

-- Policy: Todos autenticados podem ver pilares ativos
CREATE POLICY "Authenticated can view pillars"
  ON public.strategic_pillars
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Managers podem gerenciar pilares
CREATE POLICY "Managers can manage pillars"
  ON public.strategic_pillars
  FOR ALL
  USING (has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'ceo'::app_role) OR has_role(auth.uid(), 'pmo_manager'::app_role));

-- Inserir os 3 pilares fixos
INSERT INTO public.strategic_pillars (name, pillar_type, description, color_class, display_order)
VALUES 
  ('CORPO', 'corpo', 'Resultados financeiros e operacionais', 'text-green-600', 1),
  ('ALMA', 'alma', 'Engajamento e desenvolvimento do time', 'text-purple-600', 2),
  ('MENTE', 'mente', 'Experiência do cliente', 'text-blue-600', 3);

-- Adicionar coluna pillar_id na tabela strategic_theses
ALTER TABLE public.strategic_theses 
ADD COLUMN pillar_id uuid REFERENCES public.strategic_pillars(id);

-- Migrar dados existentes: mapear thesis_type para pillar_id
UPDATE public.strategic_theses st
SET pillar_id = sp.id
FROM public.strategic_pillars sp
WHERE st.thesis_type::text = sp.pillar_type::text;