import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { installment_id, payment_id, paid_date, payment_method, notes } = await req.json()

    if (!installment_id || !payment_id || !paid_date || !payment_method) {
      return NextResponse.json(
        { error: 'Installment ID, Payment ID, paid date, and payment method are required' },
        { status: 400 }
      )
    }

    // Get installment details
    const { data: installment, error: installmentError } = await supabaseAdmin
      .from('payment_installments')
      .select('*')
      .eq('id', installment_id)
      .single()

    if (installmentError || !installment) {
      return NextResponse.json(
        { error: 'Installment not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (installment.status === 'paid') {
      return NextResponse.json(
        { error: 'This installment has already been paid' },
        { status: 400 }
      )
    }

    // Update installment
    const { error: updateInstallmentError } = await supabaseAdmin
      .from('payment_installments')
      .update({
        paid_date,
        payment_method,
        notes: notes || null,
        status: 'paid'
      })
      .eq('id', installment_id)

    if (updateInstallmentError) {
      console.error('Update installment error:', updateInstallmentError)
      return NextResponse.json(
        { error: updateInstallmentError.message },
        { status: 500 }
      )
    }

    // Get current payment data
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Calculate new paid amount
    const newPaidAmount = payment.paid_amount + installment.amount

    // Determine new payment status
    let newStatus = 'partial'
    if (newPaidAmount >= payment.total_amount) {
      newStatus = 'paid'
    } else if (newPaidAmount === 0) {
      newStatus = 'partial'
    }

    // Update payment record
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({
        paid_amount: newPaidAmount,
        status: newStatus
      })
      .eq('id', payment_id)

    if (updatePaymentError) {
      console.error('Update payment error:', updatePaymentError)
      // Rollback installment update
      await supabaseAdmin
        .from('payment_installments')
        .update({
          paid_date: null,
          payment_method: null,
          notes: null,
          status: 'pending'
        })
        .eq('id', installment_id)
      
      return NextResponse.json(
        { error: 'Failed to update payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paid_amount: newPaidAmount,
      payment_status: newStatus
    })

  } catch (error: any) {
    console.error('Record payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 }
    )
  }
}
