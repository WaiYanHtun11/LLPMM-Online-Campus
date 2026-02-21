-- Check if ANY submissions exist
SELECT COUNT(*) as total_submissions FROM attendance_submissions;

-- Check for this specific student
SELECT * FROM attendance_submissions 
WHERE student_id = 'a0416af9-3de8-4d17-8eaf-78a71ffd2c2b';

-- Check what codes exist
SELECT id, code, batch_id, generated_by, valid_until, is_active 
FROM attendance_codes 
ORDER BY generated_at DESC 
LIMIT 5;

-- Check the student exists and is enrolled
SELECT 
  u.id as student_id,
  u.name,
  u.email,
  e.id as enrollment_id,
  e.batch_id,
  b.batch_name
FROM users u
LEFT JOIN enrollments e ON u.id = e.student_id
LEFT JOIN batches b ON e.batch_id = b.id
WHERE u.id = 'a0416af9-3de8-4d17-8eaf-78a71ffd2c2b';
