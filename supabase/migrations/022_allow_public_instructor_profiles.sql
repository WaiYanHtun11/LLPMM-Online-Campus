-- Allow public pages to show real instructor names on batch/course cards
-- This grants SELECT visibility of instructor rows in public.users.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.users;

CREATE POLICY "Public can view instructor profiles"
ON public.users
FOR SELECT
USING (role = 'instructor');
