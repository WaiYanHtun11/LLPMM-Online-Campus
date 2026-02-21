# Supabase Setup Guide

## ✅ Step 1: Database Configuration (DONE)

Your Supabase project is connected:
- **URL:** https://htcaeitweyjoajptofbb.supabase.co
- **Environment variables:** Created in `.env.local`
- **Client library:** Installed and configured

---

## 📋 Step 2: Run Database Migrations

### Option A: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase project:**
   - Open: https://supabase.com/dashboard
   - Select your project: `llpmm-campus` (or whatever you named it)

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Run the initial schema:**
   - Copy the entire content of: `supabase/migrations/001_initial_schema.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success message (should create 14 tables)

4. **Run sample data (optional):**
   - Create another new query
   - Copy content of: `supabase/migrations/002_sample_data.sql`
   - Paste and run
   - This creates:
     - Admin user (email: admin@llp-myanmar.com, password: admin123)
     - 6 sample courses

5. **Verify tables created:**
   - Click "Table Editor" in left sidebar
   - You should see all tables: users, courses, batches, enrollments, etc.

### Option B: Via Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref htcaeitweyjoajptofbb

# Run migrations
supabase db push
```

---

## 🔐 Step 3: Set Up Authentication

Supabase Auth is automatically enabled. We'll integrate it in the Next.js app next.

**Default config:**
- Email/password login: Enabled
- Email confirmation: Optional (can be disabled for testing)
- JWT tokens: Auto-managed by Supabase

---

## 🧪 Step 4: Test Database Connection

After running migrations, test the connection:

1. **In your Next.js app, create a test page:**

```typescript
// app/test-db/page.tsx
import { supabase } from '@/lib/supabase'

export default async function TestPage() {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .limit(3)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      {error ? (
        <p className="text-red-600">Error: {error.message}</p>
      ) : (
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(courses, null, 2)}
        </pre>
      )}
    </div>
  )
}
```

2. **Visit:** `http://localhost:3000/test-db`
3. **Expected result:** See 6 courses in JSON format

---

## 🛠️ Troubleshooting

### "relation does not exist" error
→ Migrations not run yet. Go back to Step 2.

### "permission denied" error
→ Check that your anon key has read access. Go to Supabase Dashboard → Settings → API.

### Connection timeout
→ Check internet connection. Supabase requires active internet.

---

## 🔒 Security Notes

**Important:**
- The sample admin password (`admin123`) is just for testing
- Change it immediately in production
- Never commit `.env.local` to git (it's in `.gitignore`)
- Use Row Level Security (RLS) for production (we'll add later)

---

## ✅ Next Steps

After database is set up:
1. Build admin dashboard
2. Implement authentication (Supabase Auth + Next.js)
3. Create CRUD operations for courses/batches/users
4. Build student & instructor dashboards

---

## 📊 Database Schema Overview

**14 Tables Created:**
- `users` - All users (admin, instructors, students)
- `courses` - Course curriculum templates
- `batches` - Specific class runs
- `enrollments` - Student ↔ Batch relationships
- `payments` - Payment tracking
- `payment_installments` - Installment details
- `attendance` - Class attendance codes
- `attendance_records` - Student attendance submissions
- `assignments` - Course assignments
- `submissions` - Student assignment submissions

**Relationships:**
- 1 course → many batches
- 1 batch → 1 instructor
- 1 batch → many students (via enrollments)
- 1 enrollment → 1 payment (with up to 2 installments)

---

Ready to proceed with the migrations? Let me know if you hit any issues! 💼
