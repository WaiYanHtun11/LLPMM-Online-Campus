-- Fix infinite recursion in users RLS policies
-- Root cause: users admin policies queried public.users inside public.users policies.

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = p_user_id
      AND u.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can manage users"
ON public.users
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.is_admin(auth.uid())
);
