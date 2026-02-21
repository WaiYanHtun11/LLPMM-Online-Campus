-- Run this in Supabase SQL Editor to check your setup

-- 1. Check if auth user exists
SELECT 
  id as auth_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@llp-myanmar.com';

-- 2. Check if users table record exists
SELECT 
  id as user_id,
  email,
  name,
  role
FROM public.users
WHERE email = 'admin@llp-myanmar.com';

-- 3. Check if IDs match (this is critical!)
-- The auth.users.id MUST match public.users.id
SELECT 
  'Auth User' as source,
  id,
  email
FROM auth.users
WHERE email = 'admin@llp-myanmar.com'
UNION ALL
SELECT 
  'Public User' as source,
  id,
  email
FROM public.users
WHERE email = 'admin@llp-myanmar.com';

-- 4. If IDs don't match, update the public.users table:
-- (Uncomment and replace UUID after checking above)
-- UPDATE public.users 
-- SET id = (SELECT id FROM auth.users WHERE email = 'admin@llp-myanmar.com')
-- WHERE email = 'admin@llp-myanmar.com';
