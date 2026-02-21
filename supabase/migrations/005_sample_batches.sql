-- Add sample instructors and batches
-- Run this after 002_sample_data.sql

-- Create instructor users (password: instructor123)
INSERT INTO users (email, password, name, phone, role, payment_method, payment_account_name, payment_account_number, payment_model, profit_share_percentage) VALUES
('waiyan@llp-myanmar.com', '$2a$10$rU8Q8qKxZ8KxZ8KxZ8KxZ.hashed', 'Wai Yan Htun', '09123456789', 'instructor', 'KPay', 'Wai Yan Htun', '09123456789', 'profit_share', 50),
('koaung@llp-myanmar.com', '$2a$10$rU8Q8qKxZ8KxZ8KxZ8KxZ.hashed', 'Ko Aung', '09234567890', 'instructor', 'WavePay', 'Ko Aung', '09234567890', 'fixed_salary', NULL);

-- Update Ko Aung's fixed salary
UPDATE users SET fixed_salary_amount = 500000 WHERE email = 'koaung@llp-myanmar.com';

-- Get instructor IDs (we'll need these for batches)
DO $$
DECLARE
  waiyan_id UUID;
  koaung_id UUID;
  python_course_id UUID;
  react_course_id UUID;
  django_course_id UUID;
  web_course_id UUID;
BEGIN
  -- Get instructor IDs
  SELECT id INTO waiyan_id FROM users WHERE email = 'waiyan@llp-myanmar.com';
  SELECT id INTO koaung_id FROM users WHERE email = 'koaung@llp-myanmar.com';
  
  -- Get course IDs
  SELECT id INTO python_course_id FROM courses WHERE slug = 'python-fundamentals';
  SELECT id INTO react_course_id FROM courses WHERE slug = 'react-nextjs-mastery';
  SELECT id INTO django_course_id FROM courses WHERE slug = 'django-framework';
  SELECT id INTO web_course_id FROM courses WHERE slug = 'web-dev-basics';
  
  -- Create batches (dates from today forward)
  INSERT INTO batches (course_id, batch_name, start_date, instructor_id, schedule, status) VALUES
  -- Starting in 10 days (upcoming)
  (python_course_id, 'Python - B32', CURRENT_DATE + INTERVAL '10 days', koaung_id, 'Mon/Wed/Fri · 8:00 PM', 'upcoming'),
  
  -- Starting in 20 days (upcoming)
  (web_course_id, 'Web Dev - B8', CURRENT_DATE + INTERVAL '20 days', waiyan_id, 'Tue/Thu · 7:30 PM', 'upcoming'),
  
  -- Starting in 30 days (upcoming)
  (react_course_id, 'React - B1', CURRENT_DATE + INTERVAL '30 days', waiyan_id, 'Mon/Wed/Fri · 9:00 PM', 'upcoming'),
  
  -- Starting in 50 days (upcoming)
  (python_course_id, 'Python - B33', CURRENT_DATE + INTERVAL '50 days', waiyan_id, 'Tue/Thu/Sat · 7:30 PM', 'upcoming'),
  
  -- Starting in 60 days (upcoming)
  (django_course_id, 'Django - B3', CURRENT_DATE + INTERVAL '60 days', koaung_id, 'Mon/Wed/Fri · 8:30 PM', 'upcoming');
END $$;

-- ============================================
-- DONE! Sample batches created
-- ============================================
