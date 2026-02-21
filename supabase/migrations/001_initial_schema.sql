-- LLPMM Online Campus Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  is_active BOOLEAN DEFAULT true,
  -- Instructor payment information (only for instructors)
  payment_method TEXT CHECK (payment_method IN ('KPay', 'WavePay', 'CB Pay', 'AYA Pay', 'Bank Transfer', 'Other')),
  payment_account_name TEXT,
  payment_account_number TEXT,
  -- Instructor payment model
  payment_model TEXT CHECK (payment_model IN ('fixed_salary', 'profit_share')),
  fixed_salary_amount INTEGER, -- Fixed amount per batch (if payment_model = fixed_salary)
  profit_share_percentage INTEGER CHECK (profit_share_percentage BETWEEN 0 AND 100), -- Percentage (if payment_model = profit_share)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  outlines JSONB NOT NULL DEFAULT '[]',
  duration TEXT NOT NULL,
  learning_outcomes JSONB NOT NULL DEFAULT '[]',
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  fee INTEGER NOT NULL,
  prerequisites JSONB DEFAULT '[]',
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  thumbnail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BATCHES TABLE
-- ============================================
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  max_students INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed')) DEFAULT 'upcoming',
  schedule TEXT NOT NULL,
  zoom_link TEXT,
  zoom_password TEXT,
  telegram_group_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BATCH FINANCES TABLE
-- ============================================
CREATE TABLE batch_finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID UNIQUE NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  total_revenue INTEGER DEFAULT 0, -- Sum of all student payments for this batch
  marketing_cost INTEGER DEFAULT 0, -- Facebook ads, promotions, etc.
  extra_costs INTEGER DEFAULT 0, -- Zoom subscription, materials, etc.
  total_costs INTEGER GENERATED ALWAYS AS (marketing_cost + extra_costs) STORED,
  profit INTEGER GENERATED ALWAYS AS (total_revenue - marketing_cost - extra_costs) STORED,
  instructor_payment_calculated INTEGER, -- Calculated based on instructor's payment model
  instructor_payment_status TEXT CHECK (instructor_payment_status IN ('pending', 'paid')) DEFAULT 'pending',
  instructor_paid_date DATE,
  notes TEXT, -- For any additional context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENROLLMENTS TABLE
-- ============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  enrolled_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, batch_id)
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID UNIQUE NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  base_amount INTEGER NOT NULL, -- Original course fee (before discounts)
  discount_amount INTEGER DEFAULT 0, -- Total discount applied
  total_amount INTEGER NOT NULL, -- Final amount (base_amount - discount_amount)
  paid_amount INTEGER DEFAULT 0,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('full', 'installment_2')),
  status TEXT NOT NULL CHECK (status IN ('paid', 'partial', 'overdue')) DEFAULT 'partial',
  -- Discount tracking
  multi_course_discount BOOLEAN DEFAULT false, -- True if 10K multi-course discount applied
  discount_notes TEXT, -- Reason for discount
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENT INSTALLMENTS TABLE
-- ============================================
CREATE TABLE payment_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number IN (1, 2)),
  amount INTEGER NOT NULL,
  due_type TEXT NOT NULL CHECK (due_type IN ('enrollment', 'course_start_plus_4w')),
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')) DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payment_id, number)
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  class_number INTEGER NOT NULL,
  class_date DATE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  code_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, class_number)
);

-- ============================================
-- ATTENDANCE RECORDS TABLE
-- ============================================
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('live', 'makeup')) DEFAULT 'live',
  status TEXT NOT NULL CHECK (status IN ('present', 'pending_approval', 'approved')) DEFAULT 'present',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attendance_id, student_id)
);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBMISSIONS TABLE
-- ============================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  grade INTEGER,
  feedback TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_is_active ON courses(is_active);

CREATE INDEX idx_batches_start_date ON batches(start_date);
CREATE INDEX idx_batches_course_id ON batches(course_id);
CREATE INDEX idx_batches_instructor_id ON batches(instructor_id);
CREATE INDEX idx_batches_status ON batches(status);

CREATE INDEX idx_batch_finances_batch_id ON batch_finances(batch_id);
CREATE INDEX idx_batch_finances_payment_status ON batch_finances(instructor_payment_status);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_batch_id ON enrollments(batch_id);

CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payment_installments_status ON payment_installments(status);
CREATE INDEX idx_payment_installments_due_date ON payment_installments(due_date);

CREATE INDEX idx_attendance_batch_id ON attendance(batch_id);
CREATE INDEX idx_attendance_code ON attendance(code);

CREATE INDEX idx_attendance_records_attendance_id ON attendance_records(attendance_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);

CREATE INDEX idx_assignments_batch_id ON assignments(batch_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);

-- ============================================
-- TRIGGERS for updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batch_finances_updated_at BEFORE UPDATE ON batch_finances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_installments_updated_at BEFORE UPDATE ON payment_installments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROLE VALIDATION TRIGGERS
-- ============================================
-- Validate that batch instructor has 'instructor' role
CREATE OR REPLACE FUNCTION validate_batch_instructor()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.instructor_id AND role = 'instructor') THEN
    RAISE EXCEPTION 'instructor_id must reference a user with role = instructor';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_batch_instructor
BEFORE INSERT OR UPDATE ON batches
FOR EACH ROW EXECUTE FUNCTION validate_batch_instructor();

-- Validate that enrollment student has 'student' role
CREATE OR REPLACE FUNCTION validate_enrollment_student()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.student_id AND role = 'student') THEN
    RAISE EXCEPTION 'student_id must reference a user with role = student';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_enrollment_student
BEFORE INSERT OR UPDATE ON enrollments
FOR EACH ROW EXECUTE FUNCTION validate_enrollment_student();

-- Validate attendance record student has 'student' role
CREATE TRIGGER check_attendance_record_student
BEFORE INSERT OR UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION validate_enrollment_student();

-- Validate submission student has 'student' role
CREATE TRIGGER check_submission_student
BEFORE INSERT OR UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION validate_enrollment_student();

-- Validate attendance approver has 'instructor' role (if not null)
CREATE OR REPLACE FUNCTION validate_attendance_approver()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approved_by IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.approved_by AND role = 'instructor') THEN
      RAISE EXCEPTION 'approved_by must reference a user with role = instructor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_attendance_approver
BEFORE INSERT OR UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION validate_attendance_approver();

-- Validate submission grader has 'instructor' role (if not null)
CREATE OR REPLACE FUNCTION validate_submission_grader()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.graded_by IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.graded_by AND role = 'instructor') THEN
      RAISE EXCEPTION 'graded_by must reference a user with role = instructor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_submission_grader
BEFORE INSERT OR UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION validate_submission_grader();

-- ============================================
-- DONE! Database schema created successfully
-- ============================================
