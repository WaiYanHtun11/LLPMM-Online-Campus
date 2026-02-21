# ⚠️ IMPORTANT: Add Service Role Key to .env.local

To allow admin user creation without rate limits, you need to add the **service role key** to your `.env.local` file.

## Steps:

1. **Get your Service Role Key:**
   - Go to https://supabase.com/dashboard/project/htcaeitweyjoajptofbb
   - Click **Settings** (gear icon) in sidebar
   - Click **API**
   - Scroll to **Project API keys**
   - Copy the **service_role** key (NOT the anon key!)

2. **Add to `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://htcaeitweyjoajptofbb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_dabqHs0umAMgYS8xVRAcrg_0AWBJjlV
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   ```

3. **Restart the dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

## ⚠️ Security Warning:

- **NEVER** expose the service role key in client-side code
- **NEVER** commit it to Git
- It's only used in server-side API routes (safe)
- The API route we created (`/api/admin/create-user`) runs on the server, not in the browser

## Why this fixes the rate limit:

- Regular `signUp()` has strict rate limits (a few per hour)
- Admin API using service role key has much higher limits
- Perfect for admin creating many users quickly

## Test after adding:

1. Add the key to `.env.local`
2. Restart server
3. Go to http://localhost:3000/admin/users/create
4. Try creating a user
5. Should work without rate limit errors! ✅
