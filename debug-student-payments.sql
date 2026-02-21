-- Check if payment records exist for student's enrollments
SELECT 
  e.id as enrollment_id,
  u.name as student_name,
  u.email,
  c.title as course_title,
  b.batch_name,
  e.enrolled_date,
  p.id as payment_id,
  p.base_amount,
  p.discount_amount,
  p.total_amount,
  p.paid_amount,
  p.status,
  p.plan_type
FROM enrollments e
JOIN users u ON e.student_id = u.id
JOIN batches b ON e.batch_id = b.id
JOIN courses c ON b.course_id = c.id
LEFT JOIN payments p ON p.enrollment_id = e.id
WHERE u.email = 'student@llp-myanmar.com'
ORDER BY e.enrolled_date DESC;

-- Check payment installments
SELECT 
  pi.*,
  p.enrollment_id
FROM payment_installments pi
JOIN payments p ON pi.payment_id = p.id
JOIN enrollments e ON p.enrollment_id = e.id
JOIN users u ON e.student_id = u.id
WHERE u.email = 'student@llp-myanmar.com';
