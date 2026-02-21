-- Remove fixed_salary_amount (salary varies per batch)
ALTER TABLE public.users
DROP COLUMN IF EXISTS fixed_salary_amount;
