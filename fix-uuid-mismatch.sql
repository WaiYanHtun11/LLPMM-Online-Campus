-- Fix UUID Mismatch Between auth.users and public.users
-- Run this in Supabase SQL Editor

-- STEP 1: Check current UUIDs
SELECT 
  'Auth User' as source,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'admin@llp-myanmar.com'

UNION ALL

SELECT 
  'Public User' as source,
  id,
  email,
  created_at
FROM public.users
WHERE email = 'admin@llp-myanmar.com';

-- If the IDs are DIFFERENT, continue with STEP 2


-- STEP 2: Update public.users with the correct auth UUID
UPDATE public.users 
SET id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'admin@llp-myanmar.com'
)
WHERE email = 'admin@llp-myanmar.com';


-- STEP 3: Verify the fix
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

-- The IDs should now match!


-- STEP 4: Test the user profile query
SELECT 
  id, 
  email, 
  name, 
  role, 
  phone, 
  avatar_url
FROM public.users
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@llp-myanmar.com');

-- This should return your admin user details
