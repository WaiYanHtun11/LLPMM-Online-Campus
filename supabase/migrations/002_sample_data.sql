-- LLPMM Online Campus - Sample Data
-- Run this AFTER the initial schema migration

-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- Password: admin123 (hashed with bcrypt - you should change this!)
-- Note: In production, use proper password hashing via Supabase Auth
INSERT INTO users (email, password, name, role) VALUES
('admin@llp-myanmar.com', '$2a$10$rU8Q8qKxZ8KxZ8KxZ8KxZ.hashed', 'Wai Yan Htun', 'admin');

-- ============================================
-- CREATE SAMPLE COURSES
-- ============================================
INSERT INTO courses (title, slug, description, outlines, duration, learning_outcomes, level, fee, prerequisites, category) VALUES
(
  'Python Fundamentals',
  'python-fundamentals',
  'Learn Python programming from scratch. No prior coding experience needed. Build real projects and prepare for advanced courses.',
  '["Variables and Data Types", "Control Flow (if/else, loops)", "Functions and Lambda", "Object-Oriented Programming", "File Handling"]',
  '8 weeks',
  '["Write Python programs confidently", "Understand OOP concepts", "Build real-world projects"]',
  'Beginner',
  100000,
  '[]',
  'Programming'
),
(
  'React & Next.js Mastery',
  'react-nextjs-mastery',
  'Build modern, production-ready web applications with React and Next.js framework. Learn component architecture and server-side rendering.',
  '["React Fundamentals", "Component Architecture", "State Management", "Next.js Basics", "Server-Side Rendering", "Deployment"]',
  '10 weeks',
  '["Build modern React applications", "Implement Next.js features", "Deploy production apps"]',
  'Intermediate',
  150000,
  '["JavaScript Basics"]',
  'Web Development'
),
(
  'Flutter Mobile Development',
  'flutter-mobile-dev',
  'Create cross-platform iOS & Android apps with Flutter and Dart. One codebase for both platforms.',
  '["Dart Basics", "Flutter Widgets", "State Management", "API Integration", "Firebase", "Publishing Apps"]',
  '12 weeks',
  '["Build cross-platform mobile apps", "Master Flutter framework", "Publish to app stores"]',
  'Advanced',
  200000,
  '["Python Fundamentals", "OOP Concepts"]',
  'Mobile Development'
),
(
  'Web Development Basics',
  'web-dev-basics',
  'Master HTML, CSS, and JavaScript fundamentals. Build responsive websites from scratch.',
  '["HTML5 Fundamentals", "CSS3 & Flexbox", "JavaScript Basics", "DOM Manipulation", "Responsive Design", "Final Project"]',
  '10 weeks',
  '["Build responsive websites", "Master HTML/CSS/JS", "Create web projects"]',
  'Beginner',
  120000,
  '[]',
  'Web Development'
),
(
  'Django Web Framework',
  'django-framework',
  'Build powerful web applications with Django. Learn MVT architecture, ORM, authentication, and deployment.',
  '["Django Setup", "Models & ORM", "Views & Templates", "Forms & Validation", "Authentication", "Deployment"]',
  '12 weeks',
  '["Build Django applications", "Master MVT architecture", "Deploy web apps"]',
  'Intermediate',
  180000,
  '["Python Fundamentals"]',
  'Web Development'
),
(
  'Data Structures & Algorithms',
  'dsa-python',
  'Master essential data structures and algorithms for coding interviews and competitive programming.',
  '["Arrays & Lists", "Stacks & Queues", "Trees & Graphs", "Sorting Algorithms", "Dynamic Programming", "Interview Prep"]',
  '10 weeks',
  '["Master DSA concepts", "Solve coding challenges", "Ace technical interviews"]',
  'Intermediate',
  150000,
  '["Python Fundamentals"]',
  'Computer Science'
);

-- ============================================
-- DONE! Sample data inserted
-- ============================================
-- Next steps:
-- 1. Create instructor accounts via admin dashboard
-- 2. Create batches for courses
-- 3. Enroll students
