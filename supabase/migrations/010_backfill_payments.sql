-- Migration: Backfill payment records for existing enrollments
-- Run this to create payment records for enrollments that don't have them yet

-- Create payment records for enrollments without payments
INSERT INTO payments (
  enrollment_id,
  base_amount,
  discount_amount,
  total_amount,
  paid_amount,
  plan_type,
  status,
  multi_course_discount,
  discount_notes
)
SELECT 
  e.id as enrollment_id,
  c.fee as base_amount,
  0 as discount_amount,
  c.fee as total_amount,
  0 as paid_amount,
  'installment_2' as plan_type,
  'partial' as status,
  false as multi_course_discount,
  'Backfilled for existing enrollment' as discount_notes
FROM enrollments e
INNER JOIN batches b ON e.batch_id = b.id
INNER JOIN courses c ON b.course_id = c.id
LEFT JOIN payments p ON e.id = p.enrollment_id
WHERE p.id IS NULL; -- Only create for enrollments without payment records

-- Create installments for the newly created payment records
-- Get payment IDs that were just created
WITH new_payments AS (
  SELECT 
    p.id as payment_id,
    p.total_amount,
    e.enrolled_date,
    b.start_date
  FROM payments p
  INNER JOIN enrollments e ON p.enrollment_id = e.id
  INNER JOIN batches b ON e.batch_id = b.id
  WHERE p.discount_notes = 'Backfilled for existing enrollment'
)
INSERT INTO payment_installments (
  payment_id,
  number,
  amount,
  due_type,
  due_date,
  status
)
SELECT 
  np.payment_id,
  1,
  CEIL(np.total_amount / 2.0),
  'enrollment',
  np.enrolled_date,
  'pending'
FROM new_payments np

UNION ALL

SELECT 
  np.payment_id,
  2,
  np.total_amount - CEIL(np.total_amount / 2.0),
  'course_start_plus_4w',
  (np.start_date + INTERVAL '4 weeks')::date,
  'pending'
FROM new_payments np;

-- Update discount notes to mark as processed
UPDATE payments
SET discount_notes = NULL
WHERE discount_notes = 'Backfilled for existing enrollment';

-- Show results
SELECT 
  e.id as enrollment_id,
  u.name as student_name,
  b.batch_name,
  c.title as course_title,
  p.total_amount,
  p.paid_amount,
  p.status,
  COUNT(pi.id) as installment_count
FROM enrollments e
INNER JOIN users u ON e.student_id = u.id
INNER JOIN batches b ON e.batch_id = b.id
INNER JOIN courses c ON b.course_id = c.id
LEFT JOIN payments p ON e.id = p.enrollment_id
LEFT JOIN payment_installments pi ON p.id = pi.payment_id
GROUP BY e.id, u.name, b.batch_name, c.title, p.total_amount, p.paid_amount, p.status
ORDER BY e.enrolled_date DESC;
