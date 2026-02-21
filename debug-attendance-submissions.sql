-- Debug: Check recent attendance submissions
SELECT 
  s.id,
  s.student_id,
  s.submitted_at,
  c.code,
  b.batch_name,
  co.title as course_title,
  u.name as student_name
FROM attendance_submissions s
JOIN attendance_codes c ON s.attendance_code_id = c.id
JOIN batches b ON s.batch_id = b.id
JOIN courses co ON b.course_id = co.id
JOIN users u ON s.student_id = u.id
ORDER BY s.submitted_at DESC
LIMIT 10;

-- Count total submissions
SELECT COUNT(*) as total_submissions FROM attendance_submissions;

-- Check if there are any submissions for students
SELECT 
  u.name as student_name,
  COUNT(s.id) as submission_count
FROM users u
LEFT JOIN attendance_submissions s ON u.id = s.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.name
ORDER BY submission_count DESC;
