-- Fix: Remove password column from users table
-- Password is stored in auth.users, not public.users

-- Make password nullable first (safer than dropping)
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Or completely remove the password column (recommended)
-- ALTER TABLE users DROP COLUMN password;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'password';
