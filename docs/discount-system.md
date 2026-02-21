# Student Discount System

## Overview

LLPMM Online Campus provides a loyalty discount to encourage students to enroll in multiple courses:

**Multi-Course Discount: 10,000 MMK off each additional course**

---

## Discount Rules

### First Course
- **Discount:** None
- **Student pays:** Full course fee

### Second Course (and beyond)
- **Discount:** 10,000 MMK off
- **Student pays:** Course fee - 10,000 MMK

### Applies To
- Any course after the first enrollment
- All active enrollments count (past courses also count)
- Discount applies per batch/enrollment, not per course type

---

## Examples

### Example 1: Standard Progression

**Student:** Nyi Nyi

**First Enrollment:**
- Course: Python Fundamentals - B31
- Course Fee: 100,000 MMK
- Discount: 0 MMK
- **Student pays: 100,000 MMK**

**Second Enrollment:**
- Course: Web Development Basics - B8
- Course Fee: 120,000 MMK
- Multi-Course Discount: 10,000 MMK
- **Student pays: 110,000 MMK**

**Third Enrollment:**
- Course: React & Next.js - B1
- Course Fee: 150,000 MMK
- Multi-Course Discount: 10,000 MMK
- **Student pays: 140,000 MMK**

**Total Savings:** 20,000 MMK

---

### Example 2: Different Course Levels

**Student:** Kyaw Kyaw

**Enrollments:**
1. Python Fundamentals (100,000 MMK) → Pays **100,000 MMK**
2. Django Framework (180,000 MMK) → Pays **170,000 MMK** (-10K)
3. Flutter Development (200,000 MMK) → Pays **190,000 MMK** (-10K)

**Total Paid:** 460,000 MMK (instead of 480,000 MMK)
**Total Savings:** 20,000 MMK

---

### Example 3: Concurrent Enrollments

**Student:** Hla Hla enrolls in 3 courses at the same time

**Scenario:**
- All 3 enrollments created on the same day
- System checks: How many courses has student enrolled in **before**?

**If this is the student's first time:**
1. First enrollment → Full price
2. Second enrollment → 10K off
3. Third enrollment → 10K off

**Important:** The discount is applied based on enrollment order (which course was enrolled first).

---

## Database Schema

### Payment Fields

```typescript
Payment {
  baseAmount: number // Original course fee
  discountAmount: number // Total discount (e.g., 10000)
  totalAmount: number // baseAmount - discountAmount
  multiCourseDiscount: boolean // True if 10K discount applied
  discountNotes: string // "Multi-course discount (2nd enrollment)"
}
```

### Calculation Logic

```typescript
function calculatePaymentAmount(studentId: string, courseFee: number): Payment {
  // Count how many courses student has enrolled in before
  const previousEnrollments = countEnrollments(studentId)
  
  let baseAmount = courseFee
  let discountAmount = 0
  let multiCourseDiscount = false
  let discountNotes = ""
  
  // If this is NOT their first enrollment
  if (previousEnrollments >= 1) {
    discountAmount = 10000
    multiCourseDiscount = true
    discountNotes = `Multi-course discount (${previousEnrollments + 1}${getOrdinalSuffix(previousEnrollments + 1)} enrollment)`
  }
  
  const totalAmount = baseAmount - discountAmount
  
  return {
    baseAmount,
    discountAmount,
    totalAmount,
    multiCourseDiscount,
    discountNotes
  }
}
```

---

## Admin Workflow

### When Enrolling a Student:

1. **Select student and batch**

2. **System auto-checks:**
   - Count student's previous enrollments
   - If >= 1 → Apply 10K discount

3. **Display:**
   ```
   Course Fee: 100,000 MMK
   Multi-Course Discount: -10,000 MMK
   Total Amount: 90,000 MMK
   ```

4. **Admin can:**
   - See why discount was applied
   - Override discount if needed (manual adjustment)
   - Add additional discounts (scholarship, referral, etc.)

5. **Save enrollment:**
   - Creates enrollment record
   - Creates payment record with discount tracked
   - Generates installments based on final total_amount

---

## Edge Cases

### Case 1: Dropped Courses

**Question:** If a student drops a course, do they lose the discount on future enrollments?

**Answer:** No. Past enrollments (even if dropped) still count toward the discount eligibility. The discount is based on **total number of enrollments**, not completed courses.

### Case 2: Minimum Course Fee

**Question:** What if course fee is less than 10K?

**Example:**
- Course Fee: 50,000 MMK
- Multi-Course Discount: 10,000 MMK
- Student pays: 40,000 MMK ✅

**No minimum fee required.** Discount applies even if course is cheap.

### Case 3: Manual Discounts

**Question:** Can admin add additional discounts on top of multi-course discount?

**Answer:** Yes! Admin can:
1. Add scholarship discount (e.g., 20,000 MMK)
2. Add referral discount (e.g., 5,000 MMK)
3. Multi-course discount still applies (10,000 MMK)

**Example:**
```
Base Amount: 150,000 MMK
- Multi-course discount: -10,000 MMK
- Scholarship discount: -20,000 MMK
Total Amount: 120,000 MMK
```

Store in `discountAmount` (30,000) and `discountNotes` ("Multi-course (10K) + Scholarship (20K)")

---

## Business Logic

### Why 10,000 MMK?

- Meaningful incentive for Myanmar students
- ~10% discount on typical course (100K-150K range)
- Encourages course progression (Python → Django → React)
- Builds long-term student loyalty

### Impact on Revenue

**Student Journey Example:**
- 3 courses at 100K each = 300K total potential revenue
- With discount: 100K + 90K + 90K = 280K actual revenue
- Revenue loss: 20K per 3-course student

**But:**
- Increases enrollment rate (students more likely to take 2nd+ course)
- Reduces student churn
- Builds reputation for loyalty rewards
- Lifetime value > discount cost

---

## Future Enhancements

### Potential Discount Types:
1. **Early Bird** - 15K off if enroll 1 week before batch starts
2. **Referral** - 10K off for bringing a friend
3. **Bundle** - 20K off if enroll in 2 courses at once
4. **Scholarship** - Custom discount for deserving students
5. **Corporate** - Group discounts for companies

### Discount Stacking Rules:
Define which discounts can combine:
- Multi-course + Referral: ✅ Allowed
- Multi-course + Early Bird: ✅ Allowed
- Early Bird + Bundle: ❌ Choose best one

---

## Reports & Analytics

### Admin Dashboard Should Show:

1. **Total discounts given this month**
   - Amount in MMK
   - % of revenue

2. **Discount distribution**
   - How many students got multi-course discount
   - Average discount per enrollment

3. **Student progression**
   - How many students enrolled in 2+ courses
   - Retention rate with vs without discount

4. **Most popular course sequences**
   - Python → Django (common)
   - Web Dev → React (common)
   - Helps plan course catalog

---

## Migration Notes

### Updating Existing Payments

If you already have payments in the database without discount tracking:

```sql
-- Run this to add discount fields to existing payments
UPDATE payments 
SET 
  base_amount = total_amount,
  discount_amount = 0,
  multi_course_discount = false
WHERE base_amount IS NULL;
```

### Future Enrollments

All new enrollments will automatically:
1. Calculate discount based on student's enrollment count
2. Store discount amount and reason
3. Apply discount to final amount
4. Split discounted amount across installments (if applicable)

---

Last Updated: 2026-02-19
