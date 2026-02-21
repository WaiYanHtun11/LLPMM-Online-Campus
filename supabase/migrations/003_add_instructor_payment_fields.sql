-- Add instructor payment fields to existing users table
-- Run this if you already ran 001_initial_schema.sql without payment fields

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('KPay', 'WavePay', 'CB Pay', 'AYA Pay', 'Bank Transfer', 'Other')),
ADD COLUMN IF NOT EXISTS payment_account_name TEXT,
ADD COLUMN IF NOT EXISTS payment_account_number TEXT,
ADD COLUMN IF NOT EXISTS payment_model TEXT CHECK (payment_model IN ('fixed_salary', 'profit_share')),
ADD COLUMN IF NOT EXISTS fixed_salary_amount INTEGER,
ADD COLUMN IF NOT EXISTS profit_share_percentage INTEGER CHECK (profit_share_percentage BETWEEN 0 AND 100);

-- Add comments for documentation
COMMENT ON COLUMN users.payment_method IS 'Payment method for instructors (KPay, WavePay, etc.)';
COMMENT ON COLUMN users.payment_account_name IS 'Account holder name for instructor payments';
COMMENT ON COLUMN users.payment_account_number IS 'Account/phone number for instructor payments';
COMMENT ON COLUMN users.payment_model IS 'How instructor gets paid: fixed_salary or profit_share';
COMMENT ON COLUMN users.fixed_salary_amount IS 'Fixed amount per batch (if payment_model = fixed_salary)';
COMMENT ON COLUMN users.profit_share_percentage IS 'Percentage of profit (0-100, if payment_model = profit_share)';

-- Create batch_finances table if not exists
CREATE TABLE IF NOT EXISTS batch_finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID UNIQUE NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  total_revenue INTEGER DEFAULT 0,
  marketing_cost INTEGER DEFAULT 0,
  extra_costs INTEGER DEFAULT 0,
  total_costs INTEGER GENERATED ALWAYS AS (marketing_cost + extra_costs) STORED,
  profit INTEGER GENERATED ALWAYS AS (total_revenue - marketing_cost - extra_costs) STORED,
  instructor_payment_calculated INTEGER,
  instructor_payment_status TEXT CHECK (instructor_payment_status IN ('pending', 'paid')) DEFAULT 'pending',
  instructor_paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_batch_finances_batch_id ON batch_finances(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_finances_payment_status ON batch_finances(instructor_payment_status);

-- Add trigger for updated_at
CREATE TRIGGER update_batch_finances_updated_at 
BEFORE UPDATE ON batch_finances 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

