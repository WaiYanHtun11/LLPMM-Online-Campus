import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { recalculateInstructorSalary } from '@/lib/server/recalculate-instructor-salary'

// Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: NextRequest) {
  try {
    const { 
      batch_id, 
      student_id, 
      payment_plan = 'installment_2',
      initial_payment = false,
      payment_method = null,
      payment_date = null,
      payment_notes = null
    } = await req.json()

    if (!batch_id || !student_id) {
      return NextResponse.json(
        { error: 'Batch ID and Student ID are required' },
        { status: 400 }
      )
    }

    // Check if batch exists and get course info and start date
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('id, max_students, course_id, start_date, courses!inner(fee)')
      .eq('id', batch_id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', student_id)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if batch is full
    const { count: enrollmentCount } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batch_id)

    if (enrollmentCount && enrollmentCount >= batch.max_students) {
      return NextResponse.json(
        { error: 'Batch is full' },
        { status: 400 }
      )
    }

    // Check if student is already enrolled
    const { count: existingCount } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batch_id)
      .eq('student_id', student_id)

    if (existingCount && existingCount > 0) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this batch' },
        { status: 400 }
      )
    }

    // Check multi-course discount eligibility
    const { count: previousEnrollments } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student_id)

    const isMultiCourse = previousEnrollments && previousEnrollments > 0
    const discountAmount = isMultiCourse ? 10000 : 0
    const courseFee = batch.courses.fee || 0
    const finalAmount = Math.max(0, courseFee - discountAmount)

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .insert({
        batch_id,
        student_id,
        status: 'active'
      })
      .select()
      .single()

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError)
      return NextResponse.json(
        { error: enrollmentError.message },
        { status: 500 }
      )
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        enrollment_id: enrollment.id,
        base_amount: courseFee,
        discount_amount: discountAmount,
        total_amount: finalAmount,
        paid_amount: 0,
        plan_type: payment_plan,
        status: 'partial',
        multi_course_discount: isMultiCourse,
        discount_notes: isMultiCourse ? '10,000 MMK multi-course discount applied' : null
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      // Rollback enrollment if payment creation fails
      await supabaseAdmin.from('enrollments').delete().eq('id', enrollment.id)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    // Create installments based on payment plan
    const enrollmentDate = new Date().toISOString().split('T')[0]
    const batchStartDate = new Date(batch.start_date)
    
    let installmentsToCreate: any[] = []
    
    if (payment_plan === 'full') {
      // Full payment - single installment
      installmentsToCreate = [{
        payment_id: payment.id,
        number: 1,
        amount: finalAmount,
        due_type: 'enrollment',
        due_date: enrollmentDate,
        status: initial_payment ? 'paid' : 'pending',
        paid_date: initial_payment ? payment_date : null,
        payment_method: initial_payment ? payment_method : null,
        notes: initial_payment ? payment_notes : null
      }]
    } else {
      // 2 Installments
      const installment1Amount = Math.ceil(finalAmount / 2)
      const installment2Amount = finalAmount - installment1Amount
      
      const installment2DueDate = new Date(batchStartDate)
      installment2DueDate.setDate(installment2DueDate.getDate() + 28) // 4 weeks
      
      installmentsToCreate = [
        {
          payment_id: payment.id,
          number: 1,
          amount: installment1Amount,
          due_type: 'enrollment',
          due_date: enrollmentDate,
          status: initial_payment ? 'paid' : 'pending',
          paid_date: initial_payment ? payment_date : null,
          payment_method: initial_payment ? payment_method : null,
          notes: initial_payment ? payment_notes : null
        },
        {
          payment_id: payment.id,
          number: 2,
          amount: installment2Amount,
          due_type: 'course_start_plus_4w',
          due_date: installment2DueDate.toISOString().split('T')[0],
          status: 'pending'
        }
      ]
    }
    
    const { error: installmentsError } = await supabaseAdmin
      .from('payment_installments')
      .insert(installmentsToCreate)

    if (installmentsError) {
      console.error('Installments creation error:', installmentsError)
      // Rollback payment and enrollment
      await supabaseAdmin.from('payments').delete().eq('id', payment.id)
      await supabaseAdmin.from('enrollments').delete().eq('id', enrollment.id)
      return NextResponse.json(
        { error: 'Failed to create payment installments' },
        { status: 500 }
      )
    }

    // Update payment record if initial payment was made
    if (initial_payment) {
      const paidAmount = payment_plan === 'full' ? finalAmount : Math.ceil(finalAmount / 2)
      const newStatus = paidAmount >= finalAmount ? 'paid' : 'partial'
      
      await supabaseAdmin
        .from('payments')
        .update({
          paid_amount: paidAmount,
          status: newStatus
        })
        .eq('id', payment.id)
    }

    await recalculateInstructorSalary(supabaseAdmin, batch_id)

    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      discount_applied: isMultiCourse
    })

  } catch (error: any) {
    console.error('Enroll student error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to enroll student' },
      { status: 500 }
    )
  }
}
