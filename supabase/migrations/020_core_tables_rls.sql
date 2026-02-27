-- Configure RLS for core LMS tables
-- Roles model: users.role in ('admin', 'instructor', 'student')

-- Helper to avoid circular RLS checks between batches <-> enrollments
CREATE OR REPLACE FUNCTION public.is_instructor_of_batch(p_batch_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = p_batch_id
      AND b.instructor_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_instructor_of_batch(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_instructor_of_batch(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = p_user_id
      AND u.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- ==============================
-- batches
-- ==============================
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view open batches" ON public.batches;
DROP POLICY IF EXISTS "Students can view enrolled batches" ON public.batches;
DROP POLICY IF EXISTS "Instructors can view own batches" ON public.batches;
DROP POLICY IF EXISTS "Instructors can update own batches" ON public.batches;
DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;

CREATE POLICY "Public can view open batches"
ON public.batches
FOR SELECT
USING (status IN ('upcoming', 'ongoing'));

CREATE POLICY "Students can view enrolled batches"
ON public.batches
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.batch_id = batches.id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Instructors can view own batches"
ON public.batches
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
);

CREATE POLICY "Instructors can update own batches"
ON public.batches
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
);

CREATE POLICY "Admins can manage batches"
ON public.batches
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- assignments
-- ==============================
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view assignments in enrolled batches" ON public.assignments;
DROP POLICY IF EXISTS "Instructors can view own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Instructors can insert own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Instructors can update own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Instructors can delete own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;

CREATE POLICY "Students can view assignments in enrolled batches"
ON public.assignments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.batch_id = assignments.batch_id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Instructors can view own assignments"
ON public.assignments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
);

CREATE POLICY "Instructors can insert own assignments"
ON public.assignments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = assignments.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update own assignments"
ON public.assignments
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = assignments.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete own assignments"
ON public.assignments
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
);

CREATE POLICY "Admins can manage assignments"
ON public.assignments
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- attendance
-- ==============================
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view attendance in enrolled batches" ON public.attendance;
DROP POLICY IF EXISTS "Instructors can manage attendance in own batches" ON public.attendance;
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;

CREATE POLICY "Students can view attendance in enrolled batches"
ON public.attendance
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.batch_id = attendance.batch_id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Instructors can manage attendance in own batches"
ON public.attendance
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = attendance.batch_id
      AND b.instructor_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = attendance.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage attendance"
ON public.attendance
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- attendance_codes
-- ==============================
ALTER TABLE public.attendance_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view active attendance codes for enrolled batches" ON public.attendance_codes;
DROP POLICY IF EXISTS "Instructors can view own batch attendance codes" ON public.attendance_codes;
DROP POLICY IF EXISTS "Instructors can insert attendance codes for own batches" ON public.attendance_codes;
DROP POLICY IF EXISTS "Instructors can update attendance codes for own batches" ON public.attendance_codes;
DROP POLICY IF EXISTS "Instructors can delete attendance codes for own batches" ON public.attendance_codes;
DROP POLICY IF EXISTS "Admins can manage attendance codes" ON public.attendance_codes;

CREATE POLICY "Students can view active attendance codes for enrolled batches"
ON public.attendance_codes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_active = true
  AND valid_until >= now()
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.batch_id = attendance_codes.batch_id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Instructors can view own batch attendance codes"
ON public.attendance_codes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = attendance_codes.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can insert attendance codes for own batches"
ON public.attendance_codes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND generated_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = attendance_codes.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update attendance codes for own batches"
ON public.attendance_codes
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = attendance_codes.batch_id
      AND b.instructor_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = attendance_codes.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete attendance codes for own batches"
ON public.attendance_codes
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = attendance_codes.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage attendance codes"
ON public.attendance_codes
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- attendance_records
-- ==============================
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Students can insert own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Students can update own pending attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Instructors can view attendance records in own batches" ON public.attendance_records;
DROP POLICY IF EXISTS "Instructors can update attendance records in own batches" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can manage attendance records" ON public.attendance_records;

CREATE POLICY "Students can view own attendance records"
ON public.attendance_records
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
);

CREATE POLICY "Students can insert own attendance records"
ON public.attendance_records
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.attendance a
    JOIN public.enrollments e ON e.batch_id = a.batch_id
    WHERE a.id = attendance_records.attendance_id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update own pending attendance records"
ON public.attendance_records
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND status = 'pending_approval'
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
);

CREATE POLICY "Instructors can view attendance records in own batches"
ON public.attendance_records
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.attendance a
    JOIN public.batches b ON b.id = a.batch_id
    WHERE a.id = attendance_records.attendance_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update attendance records in own batches"
ON public.attendance_records
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.attendance a
    JOIN public.batches b ON b.id = a.batch_id
    WHERE a.id = attendance_records.attendance_id
      AND b.instructor_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.attendance a
    JOIN public.batches b ON b.id = a.batch_id
    WHERE a.id = attendance_records.attendance_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage attendance records"
ON public.attendance_records
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- attendance_submissions
-- ==============================
ALTER TABLE public.attendance_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own attendance submissions" ON public.attendance_submissions;
DROP POLICY IF EXISTS "Students can insert own attendance submissions" ON public.attendance_submissions;
DROP POLICY IF EXISTS "Instructors can view attendance submissions for own batches" ON public.attendance_submissions;
DROP POLICY IF EXISTS "Admins can manage attendance submissions" ON public.attendance_submissions;

CREATE POLICY "Students can view own attendance submissions"
ON public.attendance_submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
);

CREATE POLICY "Students can insert own attendance submissions"
ON public.attendance_submissions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.batch_id = attendance_submissions.batch_id
      AND e.student_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.attendance_codes ac
    WHERE ac.id = attendance_submissions.attendance_code_id
      AND ac.batch_id = attendance_submissions.batch_id
  )
);

CREATE POLICY "Instructors can view attendance submissions for own batches"
ON public.attendance_submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = attendance_submissions.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage attendance submissions"
ON public.attendance_submissions
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- batch_expenses
-- ==============================
ALTER TABLE public.batch_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can view expenses in own batches" ON public.batch_expenses;
DROP POLICY IF EXISTS "Admins can manage batch expenses" ON public.batch_expenses;

CREATE POLICY "Instructors can view expenses in own batches"
ON public.batch_expenses
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = batch_expenses.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage batch expenses"
ON public.batch_expenses
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- batch_finances
-- ==============================
ALTER TABLE public.batch_finances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can view finance for own batches" ON public.batch_finances;
DROP POLICY IF EXISTS "Admins can manage batch finances" ON public.batch_finances;

CREATE POLICY "Instructors can view finance for own batches"
ON public.batch_finances
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.batches b
    WHERE b.id = batch_finances.batch_id
      AND b.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage batch finances"
ON public.batch_finances
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- courses
-- ==============================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;

CREATE POLICY "Public can view active courses"
ON public.courses
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- enrollments
-- ==============================
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Instructors can view enrollments in own batches" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;

CREATE POLICY "Students can view own enrollments"
ON public.enrollments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
);

CREATE POLICY "Instructors can view enrollments in own batches"
ON public.enrollments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'instructor'
  )
  AND public.is_instructor_of_batch(enrollments.batch_id, auth.uid())
);

CREATE POLICY "Admins can manage enrollments"
ON public.enrollments
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- instructor_payments
-- ==============================
ALTER TABLE public.instructor_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can view own instructor payments" ON public.instructor_payments;
DROP POLICY IF EXISTS "Admins can manage instructor payments" ON public.instructor_payments;

CREATE POLICY "Instructors can view own instructor payments"
ON public.instructor_payments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND instructor_id = auth.uid()
);

CREATE POLICY "Admins can manage instructor payments"
ON public.instructor_payments
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- payments
-- ==============================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;

CREATE POLICY "Students can view own payments"
ON public.payments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.id = payments.enrollment_id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage payments"
ON public.payments
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- payment_installments
-- ==============================
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own payment installments" ON public.payment_installments;
DROP POLICY IF EXISTS "Admins can manage payment installments" ON public.payment_installments;

CREATE POLICY "Students can view own payment installments"
ON public.payment_installments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.payments p
    JOIN public.enrollments e ON e.id = p.enrollment_id
    WHERE p.id = payment_installments.payment_id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage payment installments"
ON public.payment_installments
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- submissions (legacy table)
-- ==============================
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can insert own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Instructors can view submissions for own assignments" ON public.submissions;
DROP POLICY IF EXISTS "Instructors can grade submissions for own assignments" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;

CREATE POLICY "Students can view own submissions"
ON public.submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
);

CREATE POLICY "Students can insert own submissions"
ON public.submissions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.enrollments e ON e.batch_id = a.batch_id
    WHERE a.id = submissions.assignment_id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update own submissions"
ON public.submissions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND grade IS NULL
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND grade IS NULL
  AND feedback IS NULL
  AND graded_by IS NULL
  AND graded_at IS NULL
);

CREATE POLICY "Instructors can view submissions for own assignments"
ON public.submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = submissions.assignment_id
      AND a.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can grade submissions for own assignments"
ON public.submissions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = submissions.assignment_id
      AND a.instructor_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = submissions.assignment_id
      AND a.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage submissions"
ON public.submissions
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- testimonials
-- ==============================
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Authenticated users can view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Authenticated users can submit testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can do everything with testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;

CREATE POLICY "Public can view approved testimonials"
ON public.testimonials
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Authenticated users can view all testimonials"
ON public.testimonials
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can submit testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ==============================
-- users
-- ==============================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND id = auth.uid()
);

CREATE POLICY "Public can view instructor profiles"
ON public.users
FOR SELECT
USING (role = 'instructor');

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can manage users"
ON public.users
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin(auth.uid())
);
