-- Fix: Delete orphaned auth users that don't have matching records in public.users

-- First, check which auth users exist
SELECT id, email, created_at 
FROM auth.users
ORDER BY created_at DESC;

-- Check which public.users exist
SELECT id, email, name, role 
FROM public.users
ORDER BY created_at DESC;

-- Delete the orphaned auth user (749b0533-66df-4067-b3db-f08623578d9c)
-- This user has auth record but no public.users record
-- RUN THIS IN SUPABASE DASHBOARD (requires admin access)

-- Option 1: Delete via SQL (if you have direct DB access)
DELETE FROM auth.users 
WHERE id = '749b0533-66df-4067-b3db-f08623578d9c';

-- Option 2: Use Supabase Dashboard
-- Go to Authentication → Users
-- Find the user with ID 749b0533-66df-4067-b3db-f08623578d9c
-- Click the "..." menu → Delete user
