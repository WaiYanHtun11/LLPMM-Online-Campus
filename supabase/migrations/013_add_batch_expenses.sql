-- ============================================
-- BATCH EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS batch_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_expenses_batch_id ON batch_expenses(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_expenses_expense_date ON batch_expenses(expense_date DESC);

CREATE TRIGGER update_batch_expenses_updated_at
BEFORE UPDATE ON batch_expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
