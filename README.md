# LLPMM Online Campus

**Let's Learn Programming - Myanmar** - Online Learning Management System

🎉 **Status:** Phase 1 Complete! Authentication system ready for testing.

## Project Overview

A complete Learning Management System built with Next.js for managing online programming courses in Myanmar.

### ✅ Completed Features

**Public Pages** (World-class design with coding vibe!)
- 🏠 Landing page (animated gradients, code rain, terminal showcase)
- 📚 Course catalog (real-time data, images, filters)
- 🗓️ Upcoming batches (timeline grouping, days-away calculation)
- ℹ️ About page (teaching methods, instructor profile, story)

**Authentication System**
- 🔐 Login page with role-based routing
- 🔒 Protected dashboard routes
- 👤 User profile management
- 🎨 Beautiful gradient UI

**Dashboard Layouts** (Ready for functionality)
- 📊 Admin dashboard (manage users, courses, payments)
- 👨‍🏫 Instructor dashboard (batches, attendance, assignments)
- 🎓 Student dashboard (courses, progress, assignments)

### 🚧 In Development

**Admin Features:**
- User CRUD (create students/instructors)
- Course/batch management
- Payment tracking interface

**Instructor Features:**
- View assigned batches
- Generate attendance codes
- Post and grade assignments

**Student Features:**
- View enrolled courses
- Submit attendance codes (3-day validity)
- Submit assignments
- Track progress

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Deployment:** Vercel (planned)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and keys

# Run development server
npm run dev

# Open http://localhost:3000
```

## Authentication Setup

1. **Enable Supabase Auth:**
   - Go to Supabase Dashboard → Authentication
   - Enable Email provider
   - Disable "Confirm email" (admin creates accounts)

2. **Create auth users:**
   - Follow instructions in `/docs/AUTHENTICATION_SETUP.md`
   - Create admin account: `admin@llp-myanmar.com` / `admin123`

3. **Test login:**
   - Go to http://localhost:3000/login
   - Use admin credentials
   - Should redirect to `/admin` dashboard

See **`docs/AUTH_SUMMARY.md`** for complete authentication documentation.

## Project Structure

```
llpmm-campus/
├── app/
│   ├── page.tsx              → Landing page
│   ├── courses/              → Course pages
│   ├── batches/              → Batch pages
│   ├── about/                → About page
│   ├── login/                → Login page
│   ├── admin/                → Admin dashboard
│   ├── instructor/           → Instructor dashboard
│   └── student/              → Student dashboard
├── components/
│   └── CodeElements.tsx      → Coding vibe components
├── lib/
│   ├── supabase.ts          → Supabase client
│   └── auth-context.tsx     → Auth provider
├── docs/
│   ├── database-schema.md   → Database documentation
│   ├── AUTHENTICATION_SETUP.md
│   └── AUTH_SUMMARY.md
└── supabase/migrations/      → Database migrations
```

## Database

**Tables:** 15 (users, courses, batches, enrollments, payments, etc.)
**Sample Data:** 3 users, 6 courses, 5 batches
**Features:** Instructor payments, multi-course discounts, attendance tracking

See `/docs/database-schema.md` for complete schema.

## Development Progress

**Phase 1: Foundation** ✅
- [x] Database schema (15 tables)
- [x] Public pages (4 pages, world-class design)
- [x] Authentication system
- [x] Dashboard layouts (3 roles)

**Phase 2: Core Features** 🚧
- [ ] Admin CRUD interfaces
- [ ] Instructor batch management
- [ ] Student course access
- [ ] Attendance system
- [ ] Assignment system
- [ ] Payment tracking

**Phase 3: Advanced** 📝
- [ ] Real-time notifications
- [ ] File uploads (assignments)
- [ ] Analytics dashboard
- [ ] Batch finances
- [ ] Discount system

## Supabase Project

**URL:** https://htcaeitweyjoajptofbb.supabase.co
**Region:** Singapore (closest to Myanmar)
**Database:** PostgreSQL with RLS disabled (dev mode)

## Test Credentials

**Admin:**
- Email: `admin@llp-myanmar.com`
- Password: `admin123`
- Role: admin

(Create auth user in Supabase Dashboard first!)

## Documentation

- `/docs/database-schema.md` - Complete database schema
- `/docs/AUTHENTICATION_SETUP.md` - Auth setup guide
- `/docs/AUTH_SUMMARY.md` - Authentication system overview
- `/docs/instructor-payment-system.md` - Payment models
- `/docs/discount-system.md` - Multi-course discounts

## Development

**Built by:** Wai Yan Htun with AI Assistant  
**Started:** February 19, 2026  
**Platform:** LLPMM - Let's Learn Programming Myanmar  
**YouTube:** https://www.youtube.com/@letslearnprogramming-myanmar  
**Telegram:** https://t.me/LetsLearnProgrammingMyanmar
