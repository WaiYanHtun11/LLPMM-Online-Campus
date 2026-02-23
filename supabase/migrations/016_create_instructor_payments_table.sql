-- Create instructor_payments table for tracking payment installments per batch
CREATE TABLE IF NOT EXISTS public.instructor_payments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  batch_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  amount integer NOT NULL,
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  payment_method text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT instructor_payments_pkey PRIMARY KEY (id),
  CONSTRAINT instructor_payments_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE CASCADE,
  CONSTRAINT instructor_payments_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT instructor_payments_amount_check CHECK (amount > 0)
) TABLESPACE pg_default;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_instructor_payments_batch_id ON public.instructor_payments USING btree (batch_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_instructor_payments_instructor_id ON public.instructor_payments USING btree (instructor_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_instructor_payments_payment_date ON public.instructor_payments USING btree (payment_date) TABLESPACE pg_default;

-- Add comments
COMMENT ON TABLE public.instructor_payments IS 'Tracks individual payment installments for instructors per batch';
COMMENT ON COLUMN public.instructor_payments.amount IS 'Amount paid in this installment (in MMK)';
COMMENT ON COLUMN public.instructor_payments.payment_method IS 'Payment method used (e.g., bank transfer, cash, etc.)';
COMMENT ON COLUMN public.instructor_payments.notes IS 'Additional notes about the payment';
