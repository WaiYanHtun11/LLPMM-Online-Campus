'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface PaymentDetail {
  enrollment_id: string
  student_name: string
  student_email: string
  course_title: string
  batch_name: string
  enrolled_date: string
  base_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  status: string
  plan_type: string
  multi_course_discount: boolean
}

interface Installment {
  id: string
  number: number
  amount: number
  due_type: string
  due_date: string
  paid_date: string | null
  payment_method: string | null
  status: string
  notes: string | null
}

export default function StudentPaymentDetail() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const enrollmentId = params?.id as string
  
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'student') {
        router.push(`/${userProfile.role}`)
      }
    }
  }, [user, userProfile, authLoading, router])

  useEffect(() => {
    if (userProfile?.role === 'student' && enrollmentId) {
      fetchPaymentDetail()
    }
  }, [userProfile, enrollmentId])

  async function fetchPaymentDetail() {
    if (!userProfile?.id || !enrollmentId) return
    
    try {
      setLoading(true)
      
      // Verify enrollment belongs to this student
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_date,
          batches!inner(
            batch_name,
            courses!inner(title)
          )
        `)
        .eq('id', enrollmentId)
        .eq('student_id', userProfile.id)
        .single()

      if (enrollmentError || !enrollmentData) {
        alert('Payment record not found or access denied')
        router.push('/student/payments')
        return
      }

      // Fetch payment details
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .single()

      if (paymentError) {
        console.error('Payment fetch error:', paymentError)
      }

      const batchData = Array.isArray(enrollmentData.batches)
        ? enrollmentData.batches[0]
        : enrollmentData.batches
      const courseData = Array.isArray(batchData?.courses)
        ? batchData.courses[0]
        : batchData?.courses

      const paymentInfo: PaymentDetail = {
        enrollment_id: enrollmentId,
        student_name: userProfile.name,
        student_email: userProfile.email,
        course_title: courseData?.title || 'Untitled Course',
        batch_name: batchData?.batch_name || 'Unknown Batch',
        enrolled_date: enrollmentData.enrolled_date,
        base_amount: paymentData?.base_amount || 0,
        discount_amount: paymentData?.discount_amount || 0,
        total_amount: paymentData?.total_amount || 0,
        paid_amount: paymentData?.paid_amount || 0,
        status: paymentData?.status || 'unpaid',
        plan_type: paymentData?.plan_type || 'full',
        multi_course_discount: paymentData?.multi_course_discount || false,
      }

      setPayment(paymentInfo)

      // Fetch installments
      if (paymentData) {
        const { data: installmentsData, error: installmentsError } = await supabase
          .from('payment_installments')
          .select('*')
          .eq('payment_id', paymentData.id)
          .order('number', { ascending: true })

        if (installmentsError) {
          console.error('Installments fetch error:', installmentsError)
        } else {
          setInstallments(installmentsData || [])
        }
      }

    } catch (err: any) {
      console.error('Fetch payment detail error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount) + ' MMK'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading payment details...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'student' || !payment) {
    return null
  }

  const remaining = payment.total_amount - payment.paid_amount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/student" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
              LLPMM Campus
            </Link>
            <p className="text-sm text-gray-600 mt-1">Student Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Student: {userProfile.name}</span>
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
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/student/payments" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to My Payments
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Payment Details
          </h1>
          <p className="text-gray-600">{payment.course_title} - {payment.batch_name}</p>
        </div>

        {/* Course & Enrollment Info */}
        <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Enrollment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Course</p>
                <p className="font-semibold text-gray-900">{payment.course_title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Batch</p>
                <p className="font-semibold text-gray-900">{payment.batch_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Enrolled Date</p>
                <p className="font-semibold text-gray-900">{formatDate(payment.enrolled_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Plan</p>
                <p className="font-semibold text-gray-900">
                  {payment.plan_type === 'full' ? 'Full Payment' : '2 Installments'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Course Fee</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(payment.base_amount)}</p>
            </div>
          </div>

          {payment.discount_amount > 0 && (
            <div className="bg-gradient-to-r from-orange-200 via-red-200 to-orange-200 p-[1px] rounded-xl">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-orange-600 mb-2">
                  {payment.multi_course_discount ? 'Multi-course Discount' : 'Discount'}
                </p>
                <p className="text-2xl font-bold text-orange-600">-{formatCurrency(payment.discount_amount)}</p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-blue-600 mb-2">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(payment.total_amount)}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-200 via-emerald-200 to-green-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-green-600 mb-2">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.paid_amount)}</p>
            </div>
          </div>

          <div className={`bg-gradient-to-r ${remaining > 0 ? 'from-red-200 via-pink-200 to-red-200' : 'from-gray-200 via-slate-200 to-gray-200'} p-[1px] rounded-xl`}>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className={`text-sm mb-2 ${remaining > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                Remaining Balance
              </p>
              <p className={`text-2xl font-bold ${remaining > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Installments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-bold text-gray-900">Payment Schedule</h2>
          </div>

          {installments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No payment schedule available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Installment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Paid Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {installments.map((inst) => {
                    const isPaid = inst.status === 'paid'
                    const isOverdue = inst.status === 'overdue'
                    
                    return (
                      <tr key={inst.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          Installment {inst.number}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                          {formatCurrency(inst.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-700">
                          {formatDate(inst.due_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-700">
                          {isPaid ? formatDate(inst.paid_date!) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-700">
                          {inst.payment_method || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            isPaid
                              ? 'bg-green-100 text-green-700'
                              : isOverdue
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {isPaid ? '✓ Paid' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Notes */}
        {installments.some(i => i.notes) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Payment Notes</h3>
            <div className="space-y-2">
              {installments.filter(i => i.notes).map((inst) => (
                <div key={inst.id} className="text-sm text-blue-800">
                  <span className="font-semibold">Installment {inst.number}:</span> {inst.notes}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        {remaining > 0 && (
          <div className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-orange-900 mb-2">Outstanding Balance</h3>
                <p className="text-sm text-orange-800 mb-4">
                  You have a remaining balance of <span className="font-bold">{formatCurrency(remaining)}</span>.
                  Please contact the admin to arrange payment.
                </p>
                <p className="text-sm text-orange-700">
                  <span className="font-semibold">Note:</span> Your course access remains active regardless of payment status.
                  We trust you'll complete payment as per the schedule.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
