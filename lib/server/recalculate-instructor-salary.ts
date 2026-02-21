import { SupabaseClient } from '@supabase/supabase-js'

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function recalculateInstructorSalary(
  supabaseAdmin: SupabaseClient,
  batchId: string
) {
  const { data: batch, error: batchError } = await supabaseAdmin
    .from('batches')
    .select('id, users!inner(payment_model, profit_share_percentage)')
    .eq('id', batchId)
    .single()

  if (batchError || !batch) {
    throw new Error(batchError?.message || 'Batch not found')
  }

  const instructor = pickOne((batch as any).users)
  const paymentModel = instructor?.payment_model
  const profitPercent = Number(instructor?.profit_share_percentage || 0)

  if (paymentModel !== 'profit_share') {
    return { updated: false }
  }

  const { data: paymentsData, error: paymentsError } = await supabaseAdmin
    .from('payments')
    .select('total_amount, enrollments!inner(batch_id)')
    .eq('enrollments.batch_id', batchId)

  if (paymentsError) {
    throw new Error(paymentsError.message)
  }

  const totalIncome = (paymentsData || []).reduce((sum: number, row: any) => {
    return sum + Number(row.total_amount || 0)
  }, 0)

  const { data: expensesData, error: expensesError } = await supabaseAdmin
    .from('batch_expenses')
    .select('amount')
    .eq('batch_id', batchId)

  if (expensesError) {
    throw new Error(expensesError.message)
  }

  const totalExpenses = (expensesData || []).reduce((sum: number, row: any) => {
    return sum + Number(row.amount || 0)
  }, 0)

  const salary = Math.round((totalIncome - totalExpenses) * (profitPercent / 100))

  const { error: updateError } = await supabaseAdmin
    .from('batches')
    .update({ instructor_salary: salary })
    .eq('id', batchId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return { updated: true, salary }
}
