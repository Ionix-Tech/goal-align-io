-- Add Marketing area that was missing from the seed
-- It exists in PROJECT_CATEGORIES (categories.ts) but was never inserted into the areas table
INSERT INTO public.areas (name, code) VALUES
  ('Marketing', 'marketing')
ON CONFLICT (code) DO NOTHING;
