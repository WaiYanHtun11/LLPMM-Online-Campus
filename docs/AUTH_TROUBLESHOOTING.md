# Authentication Troubleshooting Guide

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid login credentials" error

**Possible causes:**
1. Auth user not created in Supabase
2. Wrong password
3. Email not confirmed
4. Email provider not enabled

**Solution:**

**Step 1: Check if auth user exists**
1. Go to Supabase Dashboard → Authentication → Users
2. Look for `admin@llp-myanmar.com` in the list
3. If NOT there, you need to create it:
   - Click "Add user" → "Create new user"
   - Email: `admin@llp-myanmar.com`
   - Password: `admin@password`
   - ✅ Check "Auto Confirm User"
   - Click "Create user"

**Step 2: Verify Email Provider is enabled**
1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Email" in the list
3. Make sure it's **ENABLED**
4. Make sure "Confirm email" is **DISABLED** (we don't want email confirmation for admin-created accounts)

**Step 3: Check if user is confirmed**
1. Go to Authentication → Users
2. Find `admin@llp-myanmar.com`
3. Check if "Confirmed" column shows ✅
4. If not confirmed, click the user → Click "Confirm user"

---

### Issue 2: Login succeeds but gets stuck or redirects to wrong page

**Possible cause:** UUID mismatch between `auth.users` and `public.users`

**Solution:**

1. **Run the debug SQL** (see `debug-auth.sql` file):
   ```sql
   -- Check if IDs match
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
   ```

2. **If IDs don't match**, update the public.users table:
   ```sql
   UPDATE public.users 
   SET id = (SELECT id FROM auth.users WHERE email = 'admin@llp-myanmar.com')
   WHERE email = 'admin@llp-myanmar.com';
   ```

3. **Try logging in again**

---

### Issue 3: Browser console errors

**Check browser console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for errors

**Common errors:**

**"Failed to fetch" or CORS error:**
- Check if Supabase URL and keys are correct in `.env.local`
- Restart dev server after changing env variables

**"Invalid API key":**
- Double-check `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Make sure you're using the **anon/public** key, not the service_role key

**"No such bucket" or "RLS policy violation":**
- This is fine for now, RLS is disabled for development
- Should not prevent login

---

### Issue 4: Redirect loop or "Loading..." forever

**Possible cause:** Auth state not updating properly

**Solution:**

1. **Clear browser cache and localStorage:**
   - Open DevTools (F12)
   - Go to Application tab → Storage → Local Storage
   - Delete all `supabase.auth.token` entries
   - Refresh page

2. **Check auth context:**
   - Open browser console
   - Type: `localStorage.getItem('supabase.auth.token')`
   - If null, that's normal (not logged in)
   - If has value, but login doesn't work, clear it manually

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## 🔍 Step-by-Step Debug Checklist

Run through this checklist:

### 1. Verify Environment Variables

Check `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://htcaeitweyjoajptofbb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

### 2. Verify Auth User Exists

**Supabase Dashboard → Authentication → Users:**
- [ ] `admin@llp-myanmar.com` appears in list
- [ ] "Confirmed" column shows ✅
- [ ] Copy the UUID (you'll need this)

### 3. Verify Database User Exists

**Supabase Dashboard → SQL Editor:**
```sql
SELECT id, email, name, role 
FROM users 
WHERE email = 'admin@llp-myanmar.com';
```

Should return:
- email: admin@llp-myanmar.com
- name: Admin User
- role: admin

### 4. Verify UUIDs Match

**Run in SQL Editor:**
```sql
SELECT 
  (SELECT id FROM auth.users WHERE email = 'admin@llp-myanmar.com') as auth_id,
  (SELECT id FROM users WHERE email = 'admin@llp-myanmar.com') as user_id;
```

**If they DON'T match:**
```sql
UPDATE users 
SET id = (SELECT id FROM auth.users WHERE email = 'admin@llp-myanmar.com')
WHERE email = 'admin@llp-myanmar.com';
```

### 5. Test Login

1. Go to http://localhost:3000/login
2. Enter: `admin@llp-myanmar.com`
3. Password: `admin@password`
4. Click "Sign In"
5. Watch browser console for errors

**Expected behavior:**
- Loading spinner appears
- No errors in console
- Redirects to `/admin` dashboard
- Shows "Welcome back, Admin User!"

---

## 🆘 Still Not Working?

### Enable Debug Mode

Add this to your `.env.local`:
```env
NEXT_PUBLIC_DEBUG_AUTH=true
```

Then check browser console for detailed auth logs.

### Check Supabase Logs

1. Go to Supabase Dashboard → Logs → Auth Logs
2. Look for recent login attempts
3. Check for error messages

### Common Error Messages

**"Email not confirmed"**
→ Go to Authentication → Users → Click user → "Confirm user"

**"Invalid login credentials"**
→ Wrong password or user doesn't exist

**"User not found"**
→ Auth user exists but no matching record in public.users table

**"Access denied"**
→ RLS policy blocking (shouldn't happen, RLS is disabled)

---

## 📧 Contact for Help

If still stuck, share:
1. Error message from browser console
2. Screenshot of Authentication → Users page (blur sensitive data)
3. Result of the debug SQL query

---

## 🎯 Quick Reset

If everything is messed up, start fresh:

### Reset Auth User

1. **Delete existing auth user:**
   - Supabase → Authentication → Users
   - Find admin@llp-myanmar.com
   - Click "..." → "Delete user"

2. **Create new auth user:**
   - Click "Add user" → "Create new user"
   - Email: `admin@llp-myanmar.com`
   - Password: `admin@password`
   - ✅ "Auto Confirm User"
   - Create user
   - **COPY THE UUID!**

3. **Update public.users table:**
   ```sql
   UPDATE users 
   SET id = 'PASTE_UUID_HERE'
   WHERE email = 'admin@llp-myanmar.com';
   ```

4. **Clear browser cache:**
   - Open DevTools → Application → Clear storage
   - Reload page

5. **Try login again!**
