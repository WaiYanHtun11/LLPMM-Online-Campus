-- Add instructor_salary to batches (per-batch fixed or computed for profit share)
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS instructor_salary integer;

COMMENT ON COLUMN public.batches.instructor_salary IS 'Per-batch instructor salary (fixed or computed for profit share)';
