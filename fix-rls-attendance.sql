-- Check if RLS is enabled on attendance tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('attendance_codes', 'attendance_submissions');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('attendance_codes', 'attendance_submissions');

-- Temporarily disable RLS for testing (can re-enable later)
ALTER TABLE attendance_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_submissions DISABLE ROW LEVEL SECURITY;

-- Verify the data exists
SELECT 
  s.id,
  s.student_id,
  s.batch_id,
  s.attendance_code_id,
  s.submitted_at,
  c.code,
  b.batch_name
FROM attendance_submissions s
LEFT JOIN attendance_codes c ON s.attendance_code_id = c.id
LEFT JOIN batches b ON s.batch_id = b.id
WHERE s.student_id = 'a0416af9-3de8-4d17-8eaf-78a71ffd2c2b'
ORDER BY s.submitted_at DESC;
