-- Add discount fields to existing payments table
-- Run this if you already ran 001_initial_schema.sql without discount fields

-- Add new discount columns
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS base_amount INTEGER,
ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS multi_course_discount BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_notes TEXT;

-- For existing records, set base_amount = total_amount (no discount)
UPDATE payments 
SET base_amount = total_amount
WHERE base_amount IS NULL;

-- Make base_amount required after backfill
ALTER TABLE payments 
ALTER COLUMN base_amount SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.base_amount IS 'Original course fee before any discounts';
COMMENT ON COLUMN payments.discount_amount IS 'Total discount applied (e.g., 10000 for multi-course discount)';
COMMENT ON COLUMN payments.total_amount IS 'Final amount = base_amount - discount_amount';
COMMENT ON COLUMN payments.multi_course_discount IS 'True if 10K multi-course discount was applied';
COMMENT ON COLUMN payments.discount_notes IS 'Reason for discount (e.g., "Multi-course discount (2nd enrollment)")';
