-- Add payment_status column to batches table for tracking instructor payment installments
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'Pending'::text;

-- Add check constraint for valid payment status values
ALTER TABLE public.batches
ADD CONSTRAINT batches_payment_status_check CHECK (
  payment_status = ANY (
    ARRAY['Paid'::text, 'Partially Paid'::text, 'Pending'::text]
  )
);

-- Add comment to document the column
COMMENT ON COLUMN public.batches.payment_status IS 'Instructor payment status for this batch: Paid, Partially Paid, or Pending';
