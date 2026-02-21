'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface EnrollmentPayment {
  id: string
  course_title: string
  batch_name: string
  enrolled_date: string
  base_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  remaining: number
  status: string
  plan_type: string
}

export default function StudentPayments() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [enrollments, setEnrollments] = useState<EnrollmentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    totalPaid: 0,
    totalRemaining: 0
  })

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
    if (userProfile?.role === 'student') {
      fetchPayments()
    }
  }, [userProfile])

  async function fetchPayments() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      
      // Fetch enrollments first
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('id, enrolled_date, batch_id')
        .eq('student_id', userProfile.id)
        .order('enrolled_date', { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      console.log('Enrollments data:', enrollmentsData)

      // Fetch related data for each enrollment
      const formatted = await Promise.all(
        (enrollmentsData || []).map(async (e: any) => {
          // Fetch batch and course
          const { data: batchData } = await supabase
            .from('batches')
            .select('batch_name, course_id')
            .eq('id', e.batch_id)
            .single()

          let courseTitle = 'N/A'
          if (batchData?.course_id) {
            const { data: courseData } = await supabase
              .from('courses')
              .select('title')
              .eq('id', batchData.course_id)
              .single()
            courseTitle = courseData?.title || 'N/A'
          }

          // Fetch payment data
          const { data: paymentData } = await supabase
            .from('payments')
            .select('base_amount, discount_amount, total_amount, paid_amount, status, plan_type')
            .eq('enrollment_id', e.id)
            .single()

          console.log('Payment data for enrollment', e.id, ':', paymentData)

          const payment = paymentData || {
            base_amount: 0,
            discount_amount: 0,
            total_amount: 0,
            paid_amount: 0,
            status: 'unpaid',
            plan_type: 'full'
          }

          return {
            id: e.id,
            course_title: courseTitle,
            batch_name: batchData?.batch_name || 'N/A',
            enrolled_date: e.enrolled_date,
            base_amount: payment.base_amount || 0,
            discount_amount: payment.discount_amount || 0,
            total_amount: payment.total_amount || 0,
            paid_amount: payment.paid_amount || 0,
            remaining: (payment.total_amount || 0) - (payment.paid_amount || 0),
            status: payment.status || 'unpaid',
            plan_type: payment.plan_type || 'full'
          }
        })
      )

      console.log('Formatted enrollments:', formatted)
      setEnrollments(formatted)

      // Calculate stats
      const totalPaid = formatted.reduce((sum, e) => sum + e.paid_amount, 0)
      const totalRemaining = formatted.reduce((sum, e) => sum + e.remaining, 0)

      setStats({
        totalEnrollments: formatted.length,
        totalPaid,
        totalRemaining
      })

    } catch (err: any) {
      console.error('Fetch payments error:', err)
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'student') {
    return null
  }

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
          <Link href="/student" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            My Payments
          </h1>
          <p className="text-gray-600">View your payment status and history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Enrolled Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRemaining)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
            </div>

            {enrollments.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-semibold mb-2">No enrollments yet</p>
                <p className="text-sm mb-4">Enroll in courses to see payment information</p>
                <Link href="/courses" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/student/payments/${enrollment.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition"
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{enrollment.course_title}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          enrollment.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : enrollment.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {enrollment.status === 'paid' ? 'Fully Paid' : enrollment.status === 'partial' ? 'Partial Payment' : 'Unpaid'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{enrollment.batch_name}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>Enrolled: {formatDate(enrollment.enrolled_date)}</span>
                        <span>Plan: {enrollment.plan_type === 'full' ? 'Full Payment' : '2 Installments'}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(enrollment.total_amount)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-green-600">Paid: {formatCurrency(enrollment.paid_amount)}</p>
                      </div>
                      {enrollment.remaining > 0 && (
                        <p className="text-sm text-orange-600 font-semibold">
                          Remaining: {formatCurrency(enrollment.remaining)}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="text-blue-600 text-sm font-semibold">View Details →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
