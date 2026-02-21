-- ============================================
-- CERTIFICATE ELIGIBILITY & DELIVERY
-- ============================================

-- 1) Enrollment certificate fields
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS certificate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_source TEXT CHECK (certificate_source IN ('uploaded', 'generated')),
  ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_enrollments_certificate ON enrollments(certificate);

-- 2) Storage bucket for uploaded certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can view certificates'
  ) THEN
    EXECUTE '
      CREATE POLICY "Public can view certificates"
      ON storage.objects FOR SELECT
      USING (bucket_id = ''certificates'')
    ';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can manage certificates'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can manage certificates"
      ON storage.objects FOR ALL
      USING (
        bucket_id = ''certificates''
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.role = ''admin''
        )
      )
      WITH CHECK (
        bucket_id = ''certificates''
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
            AND users.role = ''admin''
        )
      )
    ';
  END IF;
END $$;

-- 3) Calculate performance by enrollment
CREATE OR REPLACE FUNCTION calculate_enrollment_performance(p_enrollment_id UUID)
RETURNS TABLE (
  attendance_rate NUMERIC,
  assignment_rate NUMERIC,
  is_eligible BOOLEAN,
  batch_ended BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_student_id UUID;
  v_batch_id UUID;
  v_end_date DATE;
  v_total_attendance INTEGER := 0;
  v_submitted_attendance INTEGER := 0;
  v_assignment_max_total INTEGER := 0;
  v_assignment_score_total INTEGER := 0;
  v_attendance_rate NUMERIC := 0;
  v_assignment_rate NUMERIC := 0;
  v_batch_ended BOOLEAN := false;
BEGIN
  SELECT e.student_id, e.batch_id, b.end_date
  INTO v_student_id, v_batch_id, v_end_date
  FROM enrollments e
  JOIN batches b ON b.id = e.batch_id
  WHERE e.id = p_enrollment_id;

  IF v_student_id IS NULL OR v_batch_id IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, false, false;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_total_attendance
  FROM attendance_codes ac
  WHERE ac.batch_id = v_batch_id;

  SELECT COUNT(*) INTO v_submitted_attendance
  FROM attendance_submissions ats
  WHERE ats.batch_id = v_batch_id
    AND ats.student_id = v_student_id;

  IF v_total_attendance > 0 THEN
    v_attendance_rate := ROUND((v_submitted_attendance::NUMERIC / v_total_attendance::NUMERIC) * 100, 2);
  END IF;

  SELECT COALESCE(SUM(a.max_score), 0)
  INTO v_assignment_max_total
  FROM assignments a
  WHERE a.batch_id = v_batch_id;

  SELECT COALESCE(SUM(COALESCE(s.score, 0)), 0)
  INTO v_assignment_score_total
  FROM assignments a
  LEFT JOIN assignment_submissions s
    ON s.assignment_id = a.id
   AND s.student_id = v_student_id
  WHERE a.batch_id = v_batch_id;

  IF v_assignment_max_total > 0 THEN
    v_assignment_rate := ROUND((v_assignment_score_total::NUMERIC / v_assignment_max_total::NUMERIC) * 100, 2);
  END IF;

  v_batch_ended := v_end_date IS NOT NULL AND v_end_date < CURRENT_DATE;

  RETURN QUERY
  SELECT
    v_attendance_rate,
    v_assignment_rate,
    (v_batch_ended AND v_attendance_rate >= 90 AND v_assignment_rate >= 90),
    v_batch_ended;
END;
$$;

-- 4) Refresh certificate status for a single enrollment
CREATE OR REPLACE FUNCTION refresh_enrollment_certificate_status(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_attendance_rate NUMERIC;
  v_assignment_rate NUMERIC;
  v_eligible BOOLEAN;
  v_batch_ended BOOLEAN;
BEGIN
  SELECT attendance_rate, assignment_rate, is_eligible, batch_ended
  INTO v_attendance_rate, v_assignment_rate, v_eligible, v_batch_ended
  FROM calculate_enrollment_performance(p_enrollment_id);

  UPDATE enrollments
  SET
    certificate = v_eligible,
    certificate_source = CASE
      WHEN v_eligible AND certificate_url IS NULL THEN 'generated'
      WHEN certificate_url IS NOT NULL THEN 'uploaded'
      ELSE certificate_source
    END,
    certificate_issued_at = CASE
      WHEN v_eligible AND certificate_issued_at IS NULL THEN NOW()
      WHEN NOT v_eligible THEN NULL
      ELSE certificate_issued_at
    END
  WHERE id = p_enrollment_id;

  RETURN v_eligible;
END;
$$;

-- 5) Trigger helpers
CREATE OR REPLACE FUNCTION trigger_refresh_certificate_from_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment_id UUID;
BEGIN
  SELECT e.id INTO v_enrollment_id
  FROM enrollments e
  WHERE e.student_id = COALESCE(NEW.student_id, OLD.student_id)
    AND e.batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
  LIMIT 1;

  IF v_enrollment_id IS NOT NULL THEN
    PERFORM refresh_enrollment_certificate_status(v_enrollment_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION trigger_refresh_certificate_from_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_student_id UUID := COALESCE(NEW.student_id, OLD.student_id);
  v_assignment_id UUID := COALESCE(NEW.assignment_id, OLD.assignment_id);
  v_batch_id UUID;
  v_enrollment_id UUID;
BEGIN
  SELECT a.batch_id INTO v_batch_id
  FROM assignments a
  WHERE a.id = v_assignment_id;

  IF v_batch_id IS NULL OR v_student_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT e.id INTO v_enrollment_id
  FROM enrollments e
  WHERE e.student_id = v_student_id
    AND e.batch_id = v_batch_id
  LIMIT 1;

  IF v_enrollment_id IS NOT NULL THEN
    PERFORM refresh_enrollment_certificate_status(v_enrollment_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION trigger_refresh_certificate_from_batch_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.end_date IS NOT DISTINCT FROM OLD.end_date THEN
    RETURN NEW;
  END IF;

  FOR rec IN
    SELECT id FROM enrollments WHERE batch_id = NEW.id
  LOOP
    PERFORM refresh_enrollment_certificate_status(rec.id);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_cert_attendance ON attendance_submissions;
CREATE TRIGGER trg_refresh_cert_attendance
AFTER INSERT OR UPDATE OR DELETE ON attendance_submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_refresh_certificate_from_attendance();

DROP TRIGGER IF EXISTS trg_refresh_cert_assignment ON assignment_submissions;
CREATE TRIGGER trg_refresh_cert_assignment
AFTER INSERT OR UPDATE OR DELETE ON assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_refresh_certificate_from_assignment();

DROP TRIGGER IF EXISTS trg_refresh_cert_batch ON batches;
CREATE TRIGGER trg_refresh_cert_batch
AFTER UPDATE OF end_date ON batches
FOR EACH ROW
EXECUTE FUNCTION trigger_refresh_certificate_from_batch_end_date();

-- 6) Initial backfill
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM enrollments LOOP
    PERFORM refresh_enrollment_certificate_status(rec.id);
  END LOOP;
END $$;
