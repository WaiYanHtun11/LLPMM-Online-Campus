'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface PaymentRecord {
  enrollmentId: string
  studentName: string
  studentEmail: string
  batchName: string
  courseTitle: string
  enrolledDate: string
  paymentId: string | null
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: 'paid' | 'partial' | 'unpaid'
  planType: 'full' | 'installment_2' | 'unknown'
}

interface InstructorPaymentRecord {
  financeId: string
  batchName: string
  instructorName: string
  paymentModel: 'fixed_salary' | 'profit_share' | 'unknown'
  paymentMethod: string
  accountName: string
  accountNumber: string
  totalRevenue: number
  totalCosts: number
  profit: number
  calculatedPayment: number
  payoutStatus: 'paid' | 'pending'
  paidDate: string | null
}

interface EnrollmentPaymentQueryResult {
  id: string
  enrolled_date: string
  users: { name: string; email: string } | Array<{ name: string; email: string }> | null
  batches:
    | { batch_name: string; courses: { title: string } | Array<{ title: string }> | null }
    | Array<{ batch_name: string; courses: { title: string } | Array<{ title: string }> | null }>
    | null
  payments:
    | {
        id: string
        total_amount: number
        paid_amount: number
        status: string
        plan_type: string
      }
    | Array<{
        id: string
        total_amount: number
        paid_amount: number
        status: string
        plan_type: string
      }>
    | null
}

function pickOne<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default function AdminPaymentsPage() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [records, setRecords] = useState<PaymentRecord[]>([])
  const [instructorRecords, setInstructorRecords] = useState<InstructorPaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all')

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'admin') {
        router.push(`/${userProfile.role}`)
      }
    }
  }, [user, userProfile, authLoading, router])

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchPaymentRecords()
    }
  }, [userProfile])

  async function fetchPaymentRecords() {
    try {
      setLoading(true)
      setError('')

      const { data, error: queryError } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_date,
          users!inner(name, email),
          batches!inner(batch_name, courses!inner(title)),
          payments!left(id, total_amount, paid_amount, status, plan_type)
        `)
        .order('enrolled_date', { ascending: false })

      if (queryError) throw queryError

      const normalized = ((data ?? []) as EnrollmentPaymentQueryResult[]).map((row) => {
        const userRow = pickOne(row.users)
        const batchRow = pickOne(row.batches)
        const courseRow = pickOne(batchRow?.courses ?? null)
        const paymentRow = pickOne(row.payments)

        const totalAmount = paymentRow?.total_amount ?? 0
        const paidAmount = paymentRow?.paid_amount ?? 0
        const remainingAmount = Math.max(0, totalAmount - paidAmount)

        let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid'
        if (paymentRow?.status === 'paid') {
          paymentStatus = 'paid'
        } else if (paymentRow?.status === 'partial' || paidAmount > 0) {
          paymentStatus = 'partial'
        }

        const rawPlan = paymentRow?.plan_type
        const planType: 'full' | 'installment_2' | 'unknown' =
          rawPlan === 'full' || rawPlan === 'installment_2' ? rawPlan : 'unknown'

        return {
          enrollmentId: row.id,
          studentName: userRow?.name ?? 'Unknown Student',
          studentEmail: userRow?.email ?? '-',
          batchName: batchRow?.batch_name ?? 'Unknown Batch',
          courseTitle: courseRow?.title ?? 'Unknown Course',
          enrolledDate: row.enrolled_date,
          paymentId: paymentRow?.id ?? null,
          totalAmount,
          paidAmount,
          remainingAmount,
          paymentStatus,
          planType,
        }
      })

      setRecords(normalized)

      const { data: instructorData, error: instructorError } = await supabase
        .from('batch_finances')
        .select(`
          id,
          total_revenue,
          marketing_cost,
          extra_costs,
          profit,
          instructor_payment_calculated,
          instructor_payment_status,
          instructor_paid_date,
          batches!inner(
            batch_name,
            users!inner(
              name,
              payment_model,
              profit_share_percentage,
              payment_method,
              payment_account_name,
              payment_account_number
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (!instructorError) {
        const normalizedInstructor = (instructorData || []).map((row: any) => {
          const batch = pickOne(row.batches)
          const instructor = pickOne(batch?.users ?? null)

          const paymentModel: 'fixed_salary' | 'profit_share' | 'unknown' =
            instructor?.payment_model === 'fixed_salary' || instructor?.payment_model === 'profit_share'
              ? instructor.payment_model
              : 'unknown'

          const totalRevenue = Number(row.total_revenue || 0)
          const marketingCost = Number(row.marketing_cost || 0)
          const extraCosts = Number(row.extra_costs || 0)
          const totalCosts = marketingCost + extraCosts
          const profit = Number(row.profit ?? totalRevenue - totalCosts)

          let calculatedPayment = Number(row.instructor_payment_calculated || 0)
          if (calculatedPayment <= 0) {
            if (paymentModel === 'profit_share') {
              const percent = Number(instructor?.profit_share_percentage || 0)
              calculatedPayment = Math.max(0, Math.round(profit * (percent / 100)))
            }
          }

          return {
            financeId: row.id,
            batchName: batch?.batch_name || 'Unknown Batch',
            instructorName: instructor?.name || 'Unknown Instructor',
            paymentModel,
            paymentMethod: instructor?.payment_method || '-',
            accountName: instructor?.payment_account_name || '-',
            accountNumber: instructor?.payment_account_number || '-',
            totalRevenue,
            totalCosts,
            profit,
            calculatedPayment,
            payoutStatus: row.instructor_payment_status === 'paid' ? 'paid' : 'pending',
            paidDate: row.instructor_paid_date || null,
          }
        })

        setInstructorRecords(normalizedInstructor)
      }
    } catch (fetchError: unknown) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load payment records'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.paymentStatus === statusFilter
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        q.length === 0 ||
        record.studentName.toLowerCase().includes(q) ||
        record.studentEmail.toLowerCase().includes(q) ||
        record.batchName.toLowerCase().includes(q) ||
        record.courseTitle.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [records, searchQuery, statusFilter])

  const summary = useMemo(() => {
    const totalEnrollments = records.length
    const paidCount = records.filter((r) => r.paymentStatus === 'paid').length
    const partialCount = records.filter((r) => r.paymentStatus === 'partial').length
    const unpaidCount = records.filter((r) => r.paymentStatus === 'unpaid').length
    const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0)
    const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0)
    return {
      totalEnrollments,
      paidCount,
      partialCount,
      unpaidCount,
      totalAmount,
      totalPaid,
      totalRemaining: Math.max(0, totalAmount - totalPaid),
    }
  }, [records])

  const instructorSummary = useMemo(() => {
    const totalBatches = instructorRecords.length
    const paidBatches = instructorRecords.filter((r) => r.payoutStatus === 'paid').length
    const pendingBatches = instructorRecords.filter((r) => r.payoutStatus === 'pending').length
    const totalPayout = instructorRecords.reduce((sum, r) => sum + r.calculatedPayment, 0)
    const paidPayout = instructorRecords
      .filter((r) => r.payoutStatus === 'paid')
      .reduce((sum, r) => sum + r.calculatedPayment, 0)

    return {
      totalBatches,
      paidBatches,
      pendingBatches,
      totalPayout,
      paidPayout,
      pendingPayout: Math.max(0, totalPayout - paidPayout),
    }
  }, [instructorRecords])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
              LLPMM Campus
            </Link>
            <p className="text-sm text-gray-600 mt-1">Payment Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Admin: {userProfile.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-blue-600">{summary.totalEnrollments}</div>
              <div className="text-sm text-gray-600 mt-1">Total Enrollments</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600">{summary.paidCount}</div>
              <div className="text-sm text-gray-600 mt-1">Fully Paid</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-yellow-600">{summary.partialCount}</div>
              <div className="text-sm text-gray-600 mt-1">Partially Paid</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-red-600">{summary.unpaidCount}</div>
              <div className="text-sm text-gray-600 mt-1">Unpaid</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Due</div>
              <div className="text-2xl font-bold text-gray-900">{summary.totalAmount.toLocaleString()} MMK</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Collected</div>
              <div className="text-2xl font-bold text-green-600">{summary.totalPaid.toLocaleString()} MMK</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Outstanding</div>
              <div className="text-2xl font-bold text-red-600">{summary.totalRemaining.toLocaleString()} MMK</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search student, email, batch, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'partial' | 'unpaid')}
                className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Batch / Course</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid / Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No payment records match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.enrollmentId} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{record.studentName}</div>
                        <div className="text-xs text-gray-600">{record.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{record.batchName}</div>
                        <div className="text-xs text-gray-600">{record.courseTitle}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {record.planType === 'full'
                          ? 'Full Payment'
                          : record.planType === 'installment_2'
                          ? '2 Installments'
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-gray-900">
                          {record.paidAmount.toLocaleString()} / {record.totalAmount.toLocaleString()} MMK
                        </div>
                        <div className="text-xs text-gray-600">Remaining: {record.remainingAmount.toLocaleString()} MMK</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            record.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : record.paymentStatus === 'partial'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {record.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/enrollments/${record.enrollmentId}/payment`}
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-10 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Instructor Payment Tracking</h2>
          <p className="text-sm text-gray-600 mt-1">Per-batch instructor payout status and payment details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Instructor Payout</div>
              <div className="text-2xl font-bold text-gray-900">{instructorSummary.totalPayout.toLocaleString()} MMK</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Paid Out</div>
              <div className="text-2xl font-bold text-green-600">{instructorSummary.paidPayout.toLocaleString()} MMK</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Pending Payout</div>
              <div className="text-2xl font-bold text-orange-600">{instructorSummary.pendingPayout.toLocaleString()} MMK</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Revenue / Profit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payout</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {instructorRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No instructor payment finance records yet.
                      </td>
                    </tr>
                  ) : (
                    instructorRecords.map((record) => (
                      <tr key={record.financeId} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{record.instructorName}</div>
                          <div className="text-xs text-gray-600">
                            {record.paymentMethod} • {record.accountName} • {record.accountNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{record.batchName}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {record.paymentModel === 'fixed_salary'
                            ? 'Fixed Salary'
                            : record.paymentModel === 'profit_share'
                            ? 'Profit Share'
                            : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900">Revenue: {record.totalRevenue.toLocaleString()} MMK</div>
                          <div className="text-xs text-gray-600">Profit: {record.profit.toLocaleString()} MMK</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {record.calculatedPayment.toLocaleString()} MMK
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              record.payoutStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {record.payoutStatus}
                          </span>
                          {record.paidDate && (
                            <div className="text-xs text-gray-500 mt-1">Paid: {record.paidDate}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
