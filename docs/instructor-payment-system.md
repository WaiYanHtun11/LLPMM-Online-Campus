# Instructor Payment System

## Overview

LLPMM Online Campus supports two payment models for instructors:

1. **Fixed Salary** - Instructor receives a predetermined amount per batch
2. **Profit Share** - Instructor receives a percentage of the batch profit (after costs)

---

## Payment Models

### 1. Fixed Salary

**How it works:**
- Instructor gets paid a set amount per batch, regardless of revenue or profit
- Amount is defined in the instructor's profile (`fixed_salary_amount`)
- Simple and predictable

**Example:**
```
Instructor: Ko Aung
Payment Model: Fixed Salary
Fixed Salary Amount: 500,000 MMK per batch

Batch: Python - B31
Total Revenue: 1,400,000 MMK (14 students × 100,000 MMK)
Marketing Cost: 100,000 MMK
Extra Costs: 50,000 MMK
Profit: 1,250,000 MMK

→ Ko Aung gets paid: 500,000 MMK (fixed)
→ LLPMM keeps: 750,000 MMK
```

---

### 2. Profit Share

**How it works:**
- Instructor receives a percentage of the **profit** (revenue minus costs)
- Percentage is defined in instructor's profile (`profit_share_percentage`)
- Costs include: marketing costs + extra costs
- More risk, but higher potential earnings

**Example:**
```
Instructor: Wai Yan
Payment Model: Profit Share
Profit Share Percentage: 50%

Batch: Django - B3
Total Revenue: 2,160,000 MMK (12 students × 180,000 MMK)
Marketing Cost: 200,000 MMK (Facebook ads)
Extra Costs: 60,000 MMK (Zoom subscription)
Total Costs: 260,000 MMK
Profit: 1,900,000 MMK

→ Wai Yan gets paid: 950,000 MMK (50% of profit)
→ LLPMM keeps: 950,000 MMK
```

---

## Database Schema

### Instructor Profile (users table)

```typescript
// Payment information
paymentMethod: "KPay" | "WavePay" | "CB Pay" | "AYA Pay" | "Bank Transfer" | "Other"
paymentAccountName: string  // e.g., "Ko Aung"
paymentAccountNumber: string  // e.g., "09123456789"

// Payment model
paymentModel: "fixed_salary" | "profit_share"
fixedSalaryAmount?: number  // Required if paymentModel = fixed_salary
profitSharePercentage?: number  // Required if paymentModel = profit_share (0-100)
```

### Batch Finances (batch_finances table)

```typescript
batchId: UUID  // Links to batches table
totalRevenue: number  // Sum of all student payments
marketingCost: number  // Facebook ads, promotions
extraCosts: number  // Zoom, materials, etc.
totalCosts: number  // COMPUTED: marketingCost + extraCosts
profit: number  // COMPUTED: totalRevenue - totalCosts
instructorPaymentCalculated: number  // Calculated payment
instructorPaymentStatus: "pending" | "paid"
instructorPaidDate?: Date
notes?: string
```

---

## Payment Calculation Logic

### Fixed Salary
```typescript
instructorPaymentCalculated = instructor.fixedSalaryAmount
```

### Profit Share
```typescript
profit = totalRevenue - (marketingCost + extraCosts)
instructorPaymentCalculated = profit × (instructor.profitSharePercentage / 100)
```

---

## Admin Workflow

### When Creating Instructor Account:

1. **Basic Info:**
   - Name, Email, Phone
   
2. **Payment Method:**
   - Select: KPay, WavePay, CB Pay, AYA Pay, Bank Transfer, Other
   - Enter account holder name
   - Enter account/phone number
   
3. **Payment Model:**
   - Choose: Fixed Salary or Profit Share
   - If Fixed Salary: Enter amount per batch
   - If Profit Share: Enter percentage (0-100)

### When Batch Completes:

1. **Calculate Revenue:**
   - Sum all student payments for the batch
   - Update `total_revenue` in `batch_finances`

2. **Enter Costs:**
   - Add marketing costs (Facebook ads, etc.)
   - Add extra costs (Zoom, materials, etc.)
   - System auto-calculates profit

3. **Calculate Instructor Payment:**
   - System auto-calculates based on instructor's payment model
   - Shows amount in dashboard

4. **Pay Instructor:**
   - Use payment method from instructor profile
   - Transfer calculated amount
   - Mark as "paid" in system
   - Record paid date

---

## Example Scenarios

### Scenario 1: Successful Batch (Profit Share)

```
Instructor: Ma Su (Profit Share 50%)
Batch: Flutter - B1
Students Enrolled: 15
Course Fee: 200,000 MMK
Total Revenue: 3,000,000 MMK
Marketing Cost: 300,000 MMK
Extra Costs: 100,000 MMK
Profit: 2,600,000 MMK

→ Ma Su gets: 1,300,000 MMK (50%)
→ LLPMM keeps: 1,300,000 MMK
```

### Scenario 2: Low Enrollment (Fixed Salary)

```
Instructor: Ko Aung (Fixed Salary 500,000 MMK)
Batch: DSA - B2
Students Enrolled: 5
Course Fee: 150,000 MMK
Total Revenue: 750,000 MMK
Marketing Cost: 150,000 MMK
Extra Costs: 50,000 MMK
Profit: 550,000 MMK

→ Ko Aung gets: 500,000 MMK (fixed, regardless of profit)
→ LLPMM keeps: 50,000 MMK
```

### Scenario 3: Loss-Making Batch (Profit Share)

```
Instructor: Wai Yan (Profit Share 50%)
Batch: React - B1
Students Enrolled: 4
Course Fee: 150,000 MMK
Total Revenue: 600,000 MMK
Marketing Cost: 500,000 MMK
Extra Costs: 150,000 MMK
Profit: -50,000 MMK (LOSS!)

→ Wai Yan gets: 0 MMK (no profit to share)
→ LLPMM loses: 50,000 MMK
```

**Note:** In profit-share model, if there's a loss, instructor payment = 0.
Admin can still choose to pay a minimum amount manually if desired.

---

## UI/UX Considerations

### Instructor Dashboard
- Show payment model clearly
- Display current batch earnings (estimated)
- Show payment history

### Admin Dashboard
- See all instructors with payment models
- Calculate batch finances easily
- Track pending/paid instructor payments
- Generate payment reports

### Batch Finances Page
- Input revenue, marketing costs, extra costs
- Auto-calculate profit
- Auto-calculate instructor payment
- One-click mark as paid
- Show instructor payment method for easy transfer

---

## Supported Payment Methods

Myanmar mobile payment systems:
- **KPay** - KBZ Bank
- **WavePay** - Wave Money
- **CB Pay** - CB Bank
- **AYA Pay** - AYA Bank
- **Bank Transfer** - Traditional bank
- **Other** - For future flexibility

---

## Future Enhancements

- Auto-calculate revenue from student payments table
- SMS notification when instructor payment is ready
- Instructor payment request workflow
- Multi-currency support (USD, THB)
- Payment receipt generation
- Tax calculation (if needed)

---

Last Updated: 2026-02-19
