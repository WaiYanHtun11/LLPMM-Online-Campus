-- Allow authenticated users to read testimonials (including pending/rejected)
-- Needed for student feedback prefill on course detail page.

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all testimonials" ON testimonials;

CREATE POLICY "Authenticated users can view all testimonials"
ON testimonials FOR SELECT
USING (auth.uid() IS NOT NULL);
