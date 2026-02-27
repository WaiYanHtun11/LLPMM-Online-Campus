-- Enable and configure RLS for assignment_submissions
-- Scope:
-- - Students: manage only their own pending submissions for assignments in batches they are enrolled in
-- - Instructors: read and grade submissions only for assignments they created
-- - Admins: full access

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own assignment submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can insert own assignment submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can update own pending submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Instructors can view submissions for own assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Instructors can grade submissions for own assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Admins can manage assignment submissions" ON public.assignment_submissions;

CREATE POLICY "Students can view own assignment submissions"
ON public.assignment_submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
);

CREATE POLICY "Students can insert own assignment submissions"
ON public.assignment_submissions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.enrollments e ON e.batch_id = a.batch_id
    WHERE a.id = assignment_submissions.assignment_id
      AND e.student_id = auth.uid()
  )
);

CREATE POLICY "Students can update own pending submissions"
ON public.assignment_submissions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND student_id = auth.uid()
  AND status = 'pending'
  AND score IS NULL
  AND feedback IS NULL
  AND graded_by IS NULL
  AND graded_at IS NULL
);

CREATE POLICY "Instructors can view submissions for own assignments"
ON public.assignment_submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND a.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can grade submissions for own assignments"
ON public.assignment_submissions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND a.instructor_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND a.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage assignment submissions"
ON public.assignment_submissions
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
