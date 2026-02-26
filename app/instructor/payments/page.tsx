'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, Fragment } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import InstructorNavbar from '@/components/InstructorNavbar'

interface PaymentRecord {
  id: string
  amount: number
  payment_date: string
  payment_method: string | null
  notes: string | null
}

interface BatchPayment {
  id: string
  batch_name: string
  course_title: string
  start_date: string
  end_date: string
  status: string
  instructor_salary: number | null
  total_paid: number
  payment_status: 'Paid' | 'Partially Paid' | 'Pending'
  payments: PaymentRecord[]
}

export default function InstructorPayments() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [payments, setPayments] = useState<BatchPayment[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    totalEarnings: 0,
    paidAmount: 0,
    pendingAmount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'instructor') {
        router.push(`/${userProfile.role}`)
      }
    }
  }, [user, userProfile, authLoading, router])

  useEffect(() => {
    if (userProfile?.role === 'instructor') {
      fetchPayments()
    }
  }, [userProfile])

  async function fetchPayments() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)

      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select(`
          id,
          batch_name,
          start_date,
          end_date,
          status,
          instructor_salary,
          courses!inner(title)
        `)
        .eq('instructor_id', userProfile.id)
        .order('start_date', { ascending: false })

      if (batchesError) throw batchesError

      // Fetch payment records for each batch
      const batchesWithPayments = await Promise.all(
        (batchesData || []).map(async (batch: any) => {
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('instructor_payments')
            .select('id, amount, payment_date, payment_method, notes')
            .eq('batch_id', batch.id)
            .order('payment_date', { ascending: false })

          if (paymentsError) console.error('Payment fetch error:', paymentsError)

          const payments = (paymentsData || []).map((p: any) => ({
            id: p.id,
            amount: p.amount,
            payment_date: p.payment_date,
            payment_method: p.payment_method,
            notes: p.notes
          }))
          const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
          const salaryAmount = batch.instructor_salary || 0
          
          // Determine payment status based on actual payments
          let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending'
          if (totalPaid >= salaryAmount && salaryAmount > 0) {
            paymentStatus = 'Paid'
          } else if (totalPaid > 0 && totalPaid < salaryAmount) {
            paymentStatus = 'Partially Paid'
          } else {
            paymentStatus = 'Pending'
          }

          return {
            id: batch.id,
            batch_name: batch.batch_name,
            course_title: batch.courses.title,
            start_date: batch.start_date,
            end_date: batch.end_date,
            status: batch.status,
            instructor_salary: salaryAmount,
            total_paid: totalPaid,
            payment_status: paymentStatus,
            payments
          }
        })
      )

      setPayments(batchesWithPayments)

      // Calculate stats from actual payments
      const totalEarnings = batchesWithPayments.reduce((sum, p) => sum + (p.instructor_salary || 0), 0)
      const paidAmount = batchesWithPayments.reduce((sum, p) => sum + (p.total_paid || 0), 0)
      const pendingAmount = totalEarnings - paidAmount

      setStats({
        totalEarnings,
        paidAmount,
        pendingAmount
      })

    } catch (err: any) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleRow = (batchId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(batchId)) {
        newSet.delete(batchId)
      } else {
        newSet.add(batchId)
      }
      return newSet
    })
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading || loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (userProfile.role !== 'instructor') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <InstructorNavbar
        title="Instructor Portal"
        subtitle="LLPMM Online Campus"
        userName={userProfile.name}
        userEmail={userProfile.email}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/instructor" className="text-purple-600 hover:text-purple-700 text-sm font-semibold">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Payment Tracking
          </h1>
          <p className="text-gray-600">Monitor your earnings and payment status for each batch</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEarnings.toLocaleString('en-US')}</p>
                  <p className="text-xs text-purple-600">MMK</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.paidAmount.toLocaleString('en-US')}</p>
                  <p className="text-xs text-green-600">MMK</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingAmount.toLocaleString('en-US')}</p>
                  <p className="text-xs text-yellow-600">MMK</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Payment Status by Batch</h2>
            </div>

            {payments.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-semibold mb-2">No batches assigned yet</p>
                <p className="text-sm">You will see payment tracking information here once batches are assigned</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 w-8"></th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Batch Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">End Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Total Salary (MMK)</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Total Paid (MMK)</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((payment) => {
                      const showExpandButton = payment.payments.length > 1 || (payment.payment_status !== 'Paid' && payment.payments.length > 0)
                      const isExpanded = expandedRows.has(payment.id)
                      
                      return (
                        <Fragment key={payment.id}>
                          <tr className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              {showExpandButton ? (
                                <button
                                  onClick={() => toggleRow(payment.id)}
                                  className="p-1 hover:bg-gray-200 rounded transition"
                                >
                                  <svg
                                    className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              ) : (
                                <div className="w-5 h-5"></div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.batch_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{payment.course_title}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'upcoming'
                              ? 'bg-blue-100 text-blue-700'
                              : payment.status === 'ongoing'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(payment.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                          {(payment.instructor_salary || 0).toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-700 text-right">
                          {(payment.total_paid || 0).toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          {payment.payment_status === 'Paid' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Paid
                            </span>
                          ) : payment.payment_status === 'Partially Paid' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Partially Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expandable Payment History Row */}
                      {isExpanded && showExpandButton && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="ml-8">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment History</h4>
                              <div className="space-y-2">
                                {payment.payments.length === 0 ? (
                                  <p className="text-sm text-gray-500">No payment records yet</p>
                                ) : (
                                  payment.payments.map((paymentRecord) => (
                                    <div
                                      key={paymentRecord.id}
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                              {new Date(paymentRecord.payment_date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                              })}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                              {paymentRecord.payment_method ? `via ${paymentRecord.payment_method}` : 'Payment recorded'}
                                            </p>
                                            {paymentRecord.notes && (
                                              <p className="text-xs text-gray-500 mt-1">{paymentRecord.notes}</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-lg font-bold text-green-700">
                                          {paymentRecord.amount.toLocaleString('en-US')} MMK
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
