# Supabase Authentication Setup Guide

## ✅ What We've Built

1. **Auth Context** (`lib/auth-context.tsx`)
   - Manages authentication state globally
   - Provides `useAuth()` hook for components
   - Handles sign in, sign out, and user profile fetching

2. **Functional Login Page** (`app/login/page.tsx`)
   - Form with email/password fields
   - Error handling and loading states
   - Auto-redirects based on user role

3. **Protected Dashboard Routes**
   - `/admin` - Admin dashboard
   - `/instructor` - Instructor dashboard
   - `/student` - Student dashboard
   - Each with role-based access control

## 🔧 Required: Enable Supabase Auth

You need to configure Supabase Authentication in your project dashboard:

### Step 1: Enable Email/Password Provider

1. Go to https://supabase.com/dashboard
2. Select your project: `htcaeitweyjoajptofbb`
3. Go to **Authentication** → **Providers**
4. Find **Email** provider
5. Make sure it's **enabled**
6. **Confirm email** should be set to **false** (since admin creates accounts)

### Step 2: Create Auth Users

Since we already have users in the `users` table, we need to create corresponding auth users.

Run this in Supabase SQL Editor:

```sql
-- Create auth user for admin
-- This will create an auth.users entry linked to your users table
-- Password: admin123

-- Note: Supabase handles password hashing automatically
-- You'll need to use Supabase's admin API or dashboard to create users

-- For now, let's verify our users table has the right structure
SELECT id, email, name, role FROM users;
```

### Step 3: Create Test Users via Supabase Dashboard

**For Admin:**
1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Email: `admin@llp-myanmar.com`
4. Password: `admin123`
5. **Auto Confirm User:** ✅ (check this box)
6. Click **Create user**
7. **Copy the UUID** of the created user

**Update users table with the auth UUID:**
```sql
-- Replace 'AUTH_UUID_HERE' with the actual UUID from step 6
UPDATE users 
SET id = 'AUTH_UUID_HERE'
WHERE email = 'admin@llp-myanmar.com';
```

### Alternative: Use Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
# Create auth user for admin
supabase auth create admin@llp-myanmar.com admin123 --confirmed
```

## 🔐 Understanding the Auth Flow

1. **User enters credentials** on `/login` page
2. `signIn()` function calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials against `auth.users` table
4. On success:
   - Auth token stored in browser
   - `fetchUserProfile()` gets user details from `users` table
   - User redirected to role-specific dashboard
5. `useAuth()` hook provides auth state to all components

## 📁 Auth System Files

```
llpmm-campus/
├── lib/
│   ├── auth-context.tsx      ← Auth provider & context
│   └── supabase.ts            ← Supabase client
├── app/
│   ├── login/
│   │   └── page.tsx           ← Login page (functional)
│   ├── admin/
│   │   └── page.tsx           ← Admin dashboard
│   ├── instructor/
│   │   └── page.tsx           ← Instructor dashboard
│   └── student/
│       └── page.tsx           ← Student dashboard
```

## 🧪 Testing Authentication

1. **Create auth users** (follow Step 3 above)
2. Go to http://localhost:3000/login
3. Try logging in with: `admin@llp-myanmar.com` / `admin123`
4. You should be redirected to `/admin` dashboard
5. Click **Logout** to test sign out
6. Try accessing `/admin` without logging in → should redirect to `/login`

## 🛠️ Current State

- ✅ Auth context created
- ✅ Login page functional
- ✅ Dashboard pages created
- ✅ Role-based routing working
- ⏳ **Pending:** Create auth users in Supabase

## 🚀 Next Steps

Once authentication is working:

1. Add "Login" button to public pages header
2. Show user profile in header when logged in
3. Add middleware for route protection (optional - already handled in components)
4. Build admin CRUD interfaces
5. Build instructor batch management
6. Build student course/assignment interfaces

## 🔗 Useful Links

- Supabase Dashboard: https://supabase.com/dashboard/project/htcaeitweyjoajptofbb
- Auth Docs: https://supabase.com/docs/guides/auth
- JS Client: https://supabase.com/docs/reference/javascript/auth-signinwithpassword

## 💡 Tips

- Passwords in Supabase are automatically hashed (bcrypt)
- Auth tokens are stored in browser localStorage
- Session persists across page refreshes
- `onAuthStateChange` listener updates auth state automatically
- All auth operations are async (use `await`)
