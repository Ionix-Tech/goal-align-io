-- Adicionar novos valores ao enum project_category
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'diretoria';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'gestao_pessoas';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'administrativo';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'comercial';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'industrial';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'qualidade';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'engenharia';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'logistica';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'compras';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'ti';
ALTER TYPE public.project_category ADD VALUE IF NOT EXISTS 'financeiro';