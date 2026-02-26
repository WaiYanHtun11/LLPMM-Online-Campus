'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminNavbar from '@/components/AdminNavbar'

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

interface InstructorBatchPayment {
  batchId: string
  batchName: string
  instructorId: string
  instructorName: string
  salary: number
  totalPaid: number
  paymentStatus: 'Paid' | 'Partially Paid' | 'Pending'
  paymentMethod: string | null
  paymentAccountName: string | null
  paymentAccountNumber: string | null
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    paymentMethod: string | null
    notes: string | null
  }>
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
  const [instructorPayments, setInstructorPayments] = useState<InstructorBatchPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all')
  const [paymentView, setPaymentView] = useState<'student' | 'instructor'>('student')
  
  // Payment recording modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<InstructorBatchPayment | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'kpay',
    notes: ''
  })
  const [recordingPayment, setRecordingPayment] = useState(false)

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

      // Fetch instructor payments
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select(`
          id,
          batch_name,
          instructor_id,
          instructor_salary,
          users!inner(id, name, payment_method, payment_account_name, payment_account_number)
        `)
        .not('instructor_id', 'is', null)
        .order('start_date', { ascending: false })

      if (batchesError) throw batchesError

      // Fetch payment records for each batch
      const batchesWithPayments = await Promise.all(
        (batchesData || []).map(async (batch: any) => {
          const instructor = pickOne(batch.users)
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('instructor_payments')
            .select('id, amount, payment_date, payment_method, notes')
            .eq('batch_id', batch.id)
            .order('payment_date', { ascending: false })

          if (paymentsError) console.error('Error fetching payments:', paymentsError)

          const payments = paymentsData || []
          const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
          const salaryAmount = batch.instructor_salary || 0

          let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending'
          if (totalPaid >= salaryAmount && salaryAmount > 0) {
            paymentStatus = 'Paid'
          } else if (totalPaid > 0 && totalPaid < salaryAmount) {
            paymentStatus = 'Partially Paid'
          } else {
            paymentStatus = 'Pending'
          }

          return {
            batchId: batch.id,
            batchName: batch.batch_name,
            instructorId: instructor?.id,
            instructorName: instructor?.name || 'Unknown',
            salary: salaryAmount,
            totalPaid,
            paymentStatus,
            paymentMethod: instructor?.payment_method,
            paymentAccountName: instructor?.payment_account_name,
            paymentAccountNumber: instructor?.payment_account_number,
            payments: (payments || []).map((p: any) => ({
              id: p.id,
              amount: p.amount,
              paymentDate: p.payment_date,
              paymentMethod: p.payment_method,
              notes: p.notes
            }))
          }
        })
      )

      setInstructorPayments(batchesWithPayments)
    } catch (fetchError: unknown) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load payment records'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecordPayment() {
    if (!selectedBatch || !paymentForm.amount) {
      alert('Please enter an amount')
      return
    }

    try {
      setRecordingPayment(true)
      const { error } = await supabase
        .from('instructor_payments')
        .insert([
          {
            batch_id: selectedBatch.batchId,
            instructor_id: selectedBatch.instructorId,
            amount: parseInt(paymentForm.amount),
            payment_method: selectedBatch.paymentMethod,
            notes: paymentForm.notes || null,
            payment_date: new Date().toISOString()
          }
        ])

      if (error) throw error

      // Reset form and refresh
      setShowPaymentModal(false)
      setPaymentForm({ amount: '', paymentMethod: 'bank_transfer', notes: '' })
      setSelectedBatch(null)
      await fetchPaymentRecords()
    } catch (err: any) {
      alert('Error recording payment: ' + err.message)
    } finally {
      setRecordingPayment(false)
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
    const totalBatches = instructorPayments.length
    const paidBatches = instructorPayments.filter((r) => r.paymentStatus === 'Paid').length
    const partialBatches = instructorPayments.filter((r) => r.paymentStatus === 'Partially Paid').length
    const pendingBatches = instructorPayments.filter((r) => r.paymentStatus === 'Pending').length
    const totalSalary = instructorPayments.reduce((sum, r) => sum + r.salary, 0)
    const totalPaid = instructorPayments.reduce((sum, r) => sum + r.totalPaid, 0)
    const pendingPayout = totalSalary - totalPaid

    return {
      totalBatches,
      paidBatches,
      partialBatches,
      pendingBatches,
      totalSalary,
      totalPaid,
      pendingPayout,
    }
  }, [instructorPayments])

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
      <AdminNavbar
        title="Payment Tracking"
        subtitle="Track student and instructor payments"
        userName={userProfile.name}
        userEmail={userProfile.email}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to Dashboard
          </Link>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <select
              value={paymentView}
              onChange={(e) => setPaymentView(e.target.value as 'student' | 'instructor')}
              className="px-4 py-2 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full"
            >
              <option value="student">Student Payments</option>
              <option value="instructor">Instructor Payments</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl">{error}</div>
          </div>
        )}

        {paymentView === 'student' && (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Student Payment Tracking</h2>
              <p className="text-sm text-gray-600 mt-1">Enrollment payment status and collection details</p>
            </div>

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
          </>
        )}

        {paymentView === 'instructor' && (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Instructor Payment Tracking</h2>
              <p className="text-sm text-gray-600 mt-1">Per-batch instructor payout status and payment details</p>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Batches</div>
              <div className="text-2xl font-bold text-gray-900">{instructorSummary.totalBatches}</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Salary Due</div>
              <div className="text-2xl font-bold text-gray-900">{instructorSummary.totalSalary.toLocaleString()} MMK</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Paid</div>
              <div className="text-2xl font-bold text-green-600">{instructorSummary.totalPaid.toLocaleString()} MMK</div>
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
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Remaining</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {instructorPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No instructor batches yet.
                      </td>
                    </tr>
                  ) : (
                    instructorPayments.map((record) => (
                      <tr key={record.batchId} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{record.instructorName}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{record.batchName}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                          {(record.salary || 0).toLocaleString()} MMK
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-700 text-right">
                          {(record.totalPaid || 0).toLocaleString()} MMK
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-orange-700 text-right">
                          {Math.max(0, (record.salary || 0) - (record.totalPaid || 0)).toLocaleString()} MMK
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              record.paymentStatus === 'Paid'
                                ? 'bg-green-100 text-green-700'
                                : record.paymentStatus === 'Partially Paid'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {record.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedBatch(record)
                              setShowPaymentModal(true)
                            }}
                            className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition font-semibold"
                          >
                            Record Payment
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment History Accordion */}
            <div className="border-t border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Payments</h3>
              <div className="space-y-4">
                {instructorPayments.flatMap((batch) =>
                  batch.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{batch.instructorName} • {batch.batchName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} • {payment.paymentMethod || 'N/A'}
                        </p>
                        {payment.notes && <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700">{(payment.amount || 0).toLocaleString()} MMK</p>
                      </div>
                    </div>
                  ))
                )}
                {instructorPayments.every((b) => b.payments.length === 0) && (
                  <p className="text-center text-gray-500 py-4">No payments recorded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Payment Recording Modal */}
      {showPaymentModal && selectedBatch && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedBatch.instructorName} • {selectedBatch.batchName}
              </p>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Due</label>
                <p className="font-bold text-gray-900">{(selectedBatch.salary || 0).toLocaleString()} MMK</p>
                <p className="text-sm text-gray-600 mt-1">Already Paid: {(selectedBatch.totalPaid || 0).toLocaleString()} MMK</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Information</label>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Payment Method</p>
                    <p className="font-semibold text-gray-900">{selectedBatch.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Account Name</p>
                    <p className="font-semibold text-gray-900">{selectedBatch.paymentAccountName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Account Number</p>
                    <p className="font-semibold text-gray-900">{selectedBatch.paymentAccountNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount to Pay
                </label>
                <input
                  id="amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g., Partial payment, installment 1/2..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end flex-shrink-0">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedBatch(null)
                  setPaymentForm({ amount: '', paymentMethod: 'kpay', notes: '' })
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-semibold"
                disabled={recordingPayment}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={recordingPayment || !paymentForm.amount}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recordingPayment ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
