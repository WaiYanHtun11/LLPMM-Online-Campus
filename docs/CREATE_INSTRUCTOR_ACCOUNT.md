-- Check existing instructors
SELECT id, name, email, role 
FROM users 
WHERE role = 'instructor';

-- If no instructor exists with login credentials, you can create one through:
-- Option 1: Admin panel at http://localhost:3000/admin/users
-- Option 2: Or run this SQL in Supabase:

-- First, create auth user (replace with your preferred email/password)
-- Go to Supabase Dashboard → Authentication → Add User
-- Email: instructor@llp-myanmar.com
-- Password: instructor123
-- Then copy the UUID and run:

-- INSERT INTO public.users (id, name, email, role, phone)
-- VALUES 
-- ('PASTE_AUTH_UUID_HERE', 'Test Instructor', 'instructor@llp-myanmar.com', 'instructor', '+95911234567');

-- Note: Make sure instructor is assigned to at least one batch to see data on dashboard
