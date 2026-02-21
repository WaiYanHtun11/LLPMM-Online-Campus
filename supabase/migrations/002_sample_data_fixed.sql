-- LLPMM Online Campus - Sample Data (Working Version)
-- Run this AFTER the initial schema migration

-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- Password: admin123 (plaintext - change in production!)
-- Note: For now using plaintext, later we'll use Supabase Auth
INSERT INTO users (email, password, name, role) VALUES
('admin@llp-myanmar.com', 'admin123', 'Wai Yan Htun', 'admin');

-- ============================================
-- CREATE SAMPLE COURSES
-- ============================================
INSERT INTO courses (title, slug, description, outlines, duration, learning_outcomes, level, fee, prerequisites, category, is_active) VALUES
(
  'Python Fundamentals',
  'python-fundamentals',
  'Learn Python programming from scratch. No prior coding experience needed. Build real projects and prepare for advanced courses.',
  '["Variables and Data Types", "Control Flow (if/else, loops)", "Functions and Lambda", "Object-Oriented Programming", "File Handling"]'::jsonb,
  '8 weeks',
  '["Write Python programs confidently", "Understand OOP concepts", "Build real-world projects"]'::jsonb,
  'Beginner',
  100000,
  '[]'::jsonb,
  'Programming',
  true
),
(
  'React & Next.js Mastery',
  'react-nextjs-mastery',
  'Build modern, production-ready web applications with React and Next.js framework. Learn component architecture and server-side rendering.',
  '["React Fundamentals", "Component Architecture", "State Management", "Next.js Basics", "Server-Side Rendering", "Deployment"]'::jsonb,
  '10 weeks',
  '["Build modern React applications", "Implement Next.js features", "Deploy production apps"]'::jsonb,
  'Intermediate',
  150000,
  '["JavaScript Basics"]'::jsonb,
  'Web Development',
  true
),
(
  'Flutter Mobile Development',
  'flutter-mobile-dev',
  'Create cross-platform iOS & Android apps with Flutter and Dart. One codebase for both platforms.',
  '["Dart Basics", "Flutter Widgets", "State Management", "API Integration", "Firebase", "Publishing Apps"]'::jsonb,
  '12 weeks',
  '["Build cross-platform mobile apps", "Master Flutter framework", "Publish to app stores"]'::jsonb,
  'Advanced',
  200000,
  '["Python Fundamentals", "OOP Concepts"]'::jsonb,
  'Mobile Development',
  true
),
(
  'Web Development Basics',
  'web-dev-basics',
  'Master HTML, CSS, and JavaScript fundamentals. Build responsive websites from scratch.',
  '["HTML5 Fundamentals", "CSS3 & Flexbox", "JavaScript Basics", "DOM Manipulation", "Responsive Design", "Final Project"]'::jsonb,
  '10 weeks',
  '["Build responsive websites", "Master HTML/CSS/JS", "Create web projects"]'::jsonb,
  'Beginner',
  120000,
  '[]'::jsonb,
  'Web Development',
  true
),
(
  'Django Web Framework',
  'django-framework',
  'Build powerful web applications with Django. Learn MVT architecture, ORM, authentication, and deployment.',
  '["Django Setup", "Models & ORM", "Views & Templates", "Forms & Validation", "Authentication", "Deployment"]'::jsonb,
  '12 weeks',
  '["Build Django applications", "Master MVT architecture", "Deploy web apps"]'::jsonb,
  'Intermediate',
  180000,
  '["Python Fundamentals"]'::jsonb,
  'Web Development',
  true
),
(
  'Data Structures & Algorithms',
  'dsa-python',
  'Master essential data structures and algorithms for coding interviews and competitive programming.',
  '["Arrays & Lists", "Stacks & Queues", "Trees & Graphs", "Sorting Algorithms", "Dynamic Programming", "Interview Prep"]'::jsonb,
  '10 weeks',
  '["Master DSA concepts", "Solve coding challenges", "Ace technical interviews"]'::jsonb,
  'Intermediate',
  150000,
  '["Python Fundamentals"]'::jsonb,
  'Computer Science',
  true
);

-- ============================================
-- CREATE INSTRUCTOR USERS
-- ============================================
INSERT INTO users (email, password, name, phone, role, payment_method, payment_account_name, payment_account_number, payment_model, profit_share_percentage) VALUES
('waiyan@llp-myanmar.com', 'instructor123', 'Wai Yan Htun', '09123456789', 'instructor', 'KPay', 'Wai Yan Htun', '09123456789', 'profit_share', 50),
('koaung@llp-myanmar.com', 'instructor123', 'Ko Aung', '09234567890', 'instructor', 'WavePay', 'Ko Aung', '09234567890', 'fixed_salary', NULL);

-- Update Ko Aung's fixed salary
UPDATE users SET fixed_salary_amount = 500000 WHERE email = 'koaung@llp-myanmar.com';

-- ============================================
-- CREATE SAMPLE BATCHES
-- ============================================
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
  INSERT INTO batches (course_id, batch_name, start_date, instructor_id, schedule, status, max_students) VALUES
  -- Starting in 10 days (upcoming)
  (python_course_id, 'Python - B32', CURRENT_DATE + INTERVAL '10 days', koaung_id, 'Mon/Wed/Fri · 8:00 PM', 'upcoming', 30),
  
  -- Starting in 20 days (upcoming)
  (web_course_id, 'Web Dev - B8', CURRENT_DATE + INTERVAL '20 days', waiyan_id, 'Tue/Thu · 7:30 PM', 'upcoming', 25),
  
  -- Starting in 30 days (upcoming)
  (react_course_id, 'React - B1', CURRENT_DATE + INTERVAL '30 days', waiyan_id, 'Mon/Wed/Fri · 9:00 PM', 'upcoming', 20),
  
  -- Starting in 50 days (upcoming)
  (python_course_id, 'Python - B33', CURRENT_DATE + INTERVAL '50 days', waiyan_id, 'Tue/Thu/Sat · 7:30 PM', 'upcoming', 30),
  
  -- Starting in 60 days (upcoming)
  (django_course_id, 'Django - B3', CURRENT_DATE + INTERVAL '60 days', koaung_id, 'Mon/Wed/Fri · 8:30 PM', 'upcoming', 25);
END $$;

-- ============================================
-- DONE! Sample data inserted successfully
-- ============================================
-- You now have:
-- - 1 admin user (admin@llp-myanmar.com / admin123)
-- - 2 instructor users (waiyan@llp-myanmar.com, koaung@llp-myanmar.com / instructor123)
-- - 6 courses (Python, React, Flutter, Web Dev, Django, DSA)
-- - 5 upcoming batches
