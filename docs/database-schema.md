# Database Schema - LLPMM Online Campus

## Tables Overview

### Users
Base table for all user types (students, instructors, admin)

### Courses
Course curriculum (reusable across batches)

### Batches
Specific class runs of a course

### Enrollments
Student → Batch relationship

### Payments
Payment tracking with installment support

### Attendance
Class attendance records

### Assignments
Course assignments

### Submissions
Student assignment submissions

---

## Detailed Schema

### User
```typescript
User {
  id: string (UUID)
  email: string (unique)
  password: string (hashed)
  name: string
  phone?: string
  role: "admin" | "instructor" | "student"
  isActive: boolean
  
  // Instructor payment information (only for instructors)
  paymentMethod?: "KPay" | "WavePay" | "CB Pay" | "AYA Pay" | "Bank Transfer" | "Other"
  paymentAccountName?: string
  paymentAccountNumber?: string
  
  // Instructor payment model (only for instructors)
  paymentModel?: "fixed_salary" | "profit_share"
  fixedSalaryAmount?: number // Fixed amount per batch (if paymentModel = fixed_salary)
  profitSharePercentage?: number // 0-100 (if paymentModel = profit_share, e.g., 50 means 50%)
  
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  instructorBatches: Batch[] // if instructor
  enrollments: Enrollment[] // if student
  payments: Payment[] // if student
  submissions: Submission[] // if student
}
```

### Course
```typescript
Course {
  id: string (UUID)
  title: string
  slug: string (unique, URL-friendly)
  description: string
  outlines: string[] // JSON array
  duration: string // "8 weeks"
  learningOutcomes: string[] // JSON array
  level: "Beginner" | "Intermediate" | "Advanced"
  fee: number // base price in MMK
  prerequisites: string[] // JSON array
  category: string // "Programming", "Web Development", etc.
  isActive: boolean // show in catalog
  imageUrl?: string // course cover image URL
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  batches: Batch[]
}
```

### Batch
```typescript
Batch {
  id: string (UUID)
  courseId: string → Course
  batchName: string // "Python - B31"
  startDate: DateTime
  endDate?: DateTime
  instructorId: string → User
  maxStudents: number
  status: "upcoming" | "ongoing" | "completed"
  schedule: string // "Mon/Wed/Fri 8:30 PM"
  zoomLink?: string
  zoomPassword?: string
  telegramGroupId?: string
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  course: Course
  instructor: User
  enrollments: Enrollment[]
  attendances: Attendance[]
  assignments: Assignment[]
  finances: BatchFinances // one-to-one
}
```

### BatchFinances
```typescript
BatchFinances {
  id: string (UUID)
  batchId: string → Batch (unique)
  totalRevenue: number // Sum of all student payments for this batch
  marketingCost: number // Facebook ads, promotions, etc.
  extraCosts: number // Zoom subscription, materials, etc.
  totalCosts: number // COMPUTED: marketingCost + extraCosts
  profit: number // COMPUTED: totalRevenue - totalCosts
  instructorPaymentCalculated?: number // Calculated based on instructor's payment model
  instructorPaymentStatus: "pending" | "paid"
  instructorPaidDate?: DateTime
  notes?: string // Additional context
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  batch: Batch
}
```

**Instructor Payment Calculation Logic:**
- **Fixed Salary:** `instructorPaymentCalculated = instructor.fixedSalaryAmount`
- **Profit Share:** `instructorPaymentCalculated = profit * (instructor.profitSharePercentage / 100)`

Example: If profit = 1,000,000 MMK and instructor has 50% profit share → instructor gets 500,000 MMK

### Enrollment
```typescript
Enrollment {
  id: string (UUID)
  studentId: string → User
  batchId: string → Batch
  enrolledDate: DateTime
  status: "active" | "completed" | "dropped"
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  student: User
  batch: Batch
  payment: Payment
}
```

### Payment
```typescript
Payment {
  id: string (UUID)
  enrollmentId: string → Enrollment (unique)
  baseAmount: number // Original course fee (before discounts)
  discountAmount: number // Total discount applied (default 0)
  totalAmount: number // Final amount = baseAmount - discountAmount
  paidAmount: number
  planType: "full" | "installment_2"
  status: "paid" | "partial" | "overdue"
  // Discount tracking
  multiCourseDiscount: boolean // True if 10K multi-course discount applied
  discountNotes?: string // Reason for discount
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  enrollment: Enrollment
  installments: PaymentInstallment[]
}
```

**Multi-Course Discount Logic:**
- First course enrollment: Full price (no discount)
- Second+ course enrollment: 10,000 MMK off automatically
- Example: If course fee is 100,000 MMK → student pays 90,000 MMK on 2nd+ courses
- Tracked via `multiCourseDiscount` boolean and `discountAmount` field
```

### PaymentInstallment
```typescript
PaymentInstallment {
  id: string (UUID)
  paymentId: string → Payment
  number: number // 1 or 2
  amount: number
  dueType: "enrollment" | "course_start_plus_4w"
  dueDate: DateTime
  paidDate?: DateTime
  status: "paid" | "pending" | "overdue"
  paymentMethod?: string // "KBZ Pay", "Wave", "Cash"
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  payment: Payment
}
```

### Attendance
```typescript
Attendance {
  id: string (UUID)
  batchId: string → Batch
  classNumber: number
  classDate: DateTime
  code: string // unique attendance code
  codeExpiry: DateTime // classDate + 3 days
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  batch: Batch
  records: AttendanceRecord[]
}
```

### AttendanceRecord
```typescript
AttendanceRecord {
  id: string (UUID)
  attendanceId: string → Attendance
  studentId: string → User
  submittedAt: DateTime
  type: "live" | "makeup"
  status: "present" | "pending_approval" | "approved"
  approvedBy?: string → User (instructor ID)
  approvedAt?: DateTime
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  attendance: Attendance
  student: User
  approvedByInstructor?: User
}
```

### Assignment
```typescript
Assignment {
  id: string (UUID)
  batchId: string → Batch
  title: string
  description: string // markdown supported
  dueDate: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  batch: Batch
  submissions: Submission[]
}
```

### Submission
```typescript
Submission {
  id: string (UUID)
  assignmentId: string → Assignment
  studentId: string → User
  fileUrl?: string // uploaded file path
  submittedAt: DateTime
  grade?: number
  feedback?: string
  gradedBy?: string → User (instructor ID)
  gradedAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  assignment: Assignment
  student: User
  gradedByInstructor?: User
}
```

---

## Key Business Logic

### Payment Installment Calculation
```typescript
// When creating enrollment with 2 installments:
installment1 = {
  amount: totalAmount / 2,
  dueType: "enrollment",
  dueDate: enrollmentDate
}

installment2 = {
  amount: totalAmount / 2,
  dueType: "course_start_plus_4w",
  dueDate: batch.startDate + 4 weeks
}

// If batch start date changes:
// → Recalculate installment2.dueDate for all pending payments
```

### Attendance Code Validity
```typescript
// Code expires 3 days after class date
codeExpiry = classDate + 3 days

// Student can submit:
// - Live: during/right after class
// - Makeup: within 3 days after watching recording
```

### User Access Control
```typescript
// Admin: full access to everything
// Instructor: only their assigned batches & students
// Student: only their enrolled courses & data
```

---

## Indexes (for performance)

```sql
-- User lookups
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_user_role ON User(role);

-- Course catalog
CREATE INDEX idx_course_slug ON Course(slug);
CREATE INDEX idx_course_isActive ON Course(isActive);

-- Batch queries
CREATE INDEX idx_batch_startDate ON Batch(startDate);
CREATE INDEX idx_batch_courseId ON Batch(courseId);
CREATE INDEX idx_batch_instructorId ON Batch(instructorId);

-- Enrollment lookups
CREATE INDEX idx_enrollment_studentId ON Enrollment(studentId);
CREATE INDEX idx_enrollment_batchId ON Enrollment(batchId);

-- Payment tracking
CREATE INDEX idx_payment_status ON Payment(status);
CREATE INDEX idx_installment_status ON PaymentInstallment(status);
CREATE INDEX idx_installment_dueDate ON PaymentInstallment(dueDate);

-- Attendance
CREATE INDEX idx_attendance_code ON Attendance(code);
CREATE INDEX idx_attendance_batchId ON Attendance(batchId);
```

---

## Migration Notes

This schema is designed to be implemented with Prisma ORM. The actual Prisma schema file will be created in `/prisma/schema.prisma`.
