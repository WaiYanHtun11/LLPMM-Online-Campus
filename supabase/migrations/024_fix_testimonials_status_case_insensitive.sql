-- Fix testimonials status constraint to be case-insensitive
-- This allows status values like 'Approved', 'PENDING', etc. to pass validation

ALTER TABLE testimonials
DROP CONSTRAINT IF EXISTS testimonials_status_check;

ALTER TABLE testimonials
ADD CONSTRAINT testimonials_status_check CHECK (LOWER(status) IN ('pending', 'approved', 'rejected'));
