'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface DashboardActivity {
  id: string
  type: 'user' | 'enrollment' | 'payment' | 'attendance' | 'assignment'
  title: string
  subtitle: string
  date: string
}

export default function AdminDashboard() {
  const { user, userProfile, loading, signOut } = useAuth()
  const router = useRouter()
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'admin') {
        if (userProfile.role === 'instructor') {
          router.push('/instructor')
        } else if (userProfile.role === 'student') {
          router.push('/student')
        }
      }
    }
  }, [user, userProfile, loading, router])

  useEffect(() => {
    if (!loading && userProfile?.role === 'admin') {
      fetchRecentActivity()
    }
  }, [loading, userProfile])

  async function fetchRecentActivity() {
    try {
      setActivityLoading(true)

      const [usersRes, enrollmentsRes, paidRes, attendanceRes, assignmentRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, name, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('enrollments')
          .select('id, enrolled_date, users!inner(name), batches!inner(batch_name)')
          .order('enrolled_date', { ascending: false })
          .limit(5),
        supabase
          .from('payment_installments')
          .select('id, paid_date, amount, payment_method, payments!inner(enrollments!inner(users!inner(name), batches!inner(batch_name)))')
          .eq('status', 'paid')
          .not('paid_date', 'is', null)
          .order('paid_date', { ascending: false })
          .limit(5),
        supabase
          .from('attendance_submissions')
          .select('id, submitted_at, users!inner(name), batches!inner(batch_name)')
          .order('submitted_at', { ascending: false })
          .limit(5),
        supabase
          .from('assignment_submissions')
          .select('id, submitted_at, status, users!inner(name), assignments!inner(title)')
          .order('submitted_at', { ascending: false })
          .limit(5),
      ])

      const activities: DashboardActivity[] = []

      if (!usersRes.error) {
        activities.push(
          ...(usersRes.data || []).map((row: any) => ({
            id: `user-${row.id}`,
            type: 'user' as const,
            title: `New ${row.role} account created`,
            subtitle: row.name || 'Unnamed user',
            date: row.created_at,
          }))
        )
      }

      if (!enrollmentsRes.error) {
        activities.push(
          ...(enrollmentsRes.data || []).map((row: any) => ({
            id: `enrollment-${row.id}`,
            type: 'enrollment' as const,
            title: 'Student enrolled in batch',
            subtitle: `${row.users?.name || 'Unknown student'} → ${row.batches?.batch_name || 'Unknown batch'}`,
            date: row.enrolled_date,
          }))
        )
      }

      if (!paidRes.error) {
        activities.push(
          ...(paidRes.data || []).map((row: any) => {
            const enrollment = Array.isArray(row.payments?.enrollments)
              ? row.payments.enrollments[0]
              : row.payments?.enrollments
            const student = Array.isArray(enrollment?.users) ? enrollment.users[0] : enrollment?.users
            const batch = Array.isArray(enrollment?.batches) ? enrollment.batches[0] : enrollment?.batches

            return {
              id: `payment-${row.id}`,
              type: 'payment' as const,
              title: `Payment received (${Number(row.amount || 0).toLocaleString()} MMK)`,
              subtitle: `${student?.name || 'Unknown student'} • ${batch?.batch_name || 'Unknown batch'}${row.payment_method ? ` • ${row.payment_method}` : ''}`,
              date: row.paid_date,
            }
          })
        )
      }

      if (!attendanceRes.error) {
        activities.push(
          ...(attendanceRes.data || []).map((row: any) => ({
            id: `attendance-${row.id}`,
            type: 'attendance' as const,
            title: 'Attendance submitted',
            subtitle: `${row.users?.name || 'Unknown student'} • ${row.batches?.batch_name || 'Unknown batch'}`,
            date: row.submitted_at,
          }))
        )
      }

      if (!assignmentRes.error) {
        activities.push(
          ...(assignmentRes.data || []).map((row: any) => ({
            id: `assignment-${row.id}`,
            type: 'assignment' as const,
            title: `Assignment ${row.status || 'submitted'}`,
            subtitle: `${row.users?.name || 'Unknown student'} • ${row.assignments?.title || 'Untitled assignment'}`,
            date: row.submitted_at,
          }))
        )
      }

      const sorted = activities
        .filter((item) => !!item.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)

      setRecentActivity(sorted)
    } catch {
      setRecentActivity([])
    } finally {
      setActivityLoading(false)
    }
  }

  const formatActivityDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const activityStyle: Record<DashboardActivity['type'], { icon: string; badge: string }> = {
    user: { icon: '👤', badge: 'bg-purple-100 text-purple-700' },
    enrollment: { icon: '🎓', badge: 'bg-blue-100 text-blue-700' },
    payment: { icon: '💰', badge: 'bg-green-100 text-green-700' },
    attendance: { icon: '✅', badge: 'bg-orange-100 text-orange-700' },
    assignment: { icon: '📝', badge: 'bg-indigo-100 text-indigo-700' },
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Image
                  src="/llpmm-logo.jpg"
                  alt="LLPMM Logo"
                  width={50}
                  height={50}
                  className="rounded-full"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">LLPMM Online Campus</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{userProfile.name}</p>
                <p className="text-xs text-gray-600">{userProfile.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {userProfile.name}! 👋</h2>
          <p className="text-blue-100">Manage your online campus from here.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">6</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Running Batches</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Instructors</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/users" className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-md transition cursor-pointer">
            <div className="bg-white rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2">👥 Manage Users</h3>
              <p className="text-gray-600 text-sm mb-4">Create and manage student and instructor accounts</p>
              <span className="text-blue-600 text-sm font-semibold mt-auto">Go to Users →</span>
            </div>
          </Link>

          <Link href="/admin/courses" className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-md transition cursor-pointer">
            <div className="bg-white rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2">📚 Manage Courses</h3>
              <p className="text-gray-600 text-sm mb-4">Add, edit, and organize course templates</p>
              <span className="text-blue-600 text-sm font-semibold mt-auto">Go to Courses →</span>
            </div>
          </Link>

          <Link href="/admin/batches" className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-md transition cursor-pointer">
            <div className="bg-white rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🎓 Manage Batches</h3>
              <p className="text-gray-600 text-sm mb-4">Create batches and assign instructors</p>
              <span className="text-blue-600 text-sm font-semibold mt-auto">Go to Batches →</span>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Link href="/admin/attendance" className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-md transition cursor-pointer">
            <div className="bg-white rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2">✅ Attendance Reports</h3>
              <p className="text-gray-600 text-sm mb-4">View attendance statistics across all batches</p>
              <span className="text-blue-600 text-sm font-semibold mt-auto">View Reports →</span>
            </div>
          </Link>

          <Link href="/admin/payments" className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-md transition cursor-pointer">
            <div className="bg-white rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2">💰 Payment Tracking</h3>
              <p className="text-gray-600 text-sm mb-4">Monitor enrollments and payment status</p>
              <span className="text-blue-600 text-sm font-semibold mt-auto">Open Payment Tracking →</span>
            </div>
          </Link>

          <Link href="/admin/finance" className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-md transition cursor-pointer">
            <div className="bg-white rounded-xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-2">📈 Revenue & Expense Tracking</h3>
              <p className="text-gray-600 text-sm mb-4">Track income trends and operational costs in one place</p>
              <span className="text-blue-600 text-sm font-semibold mt-auto">Open Revenue & Expense Tracking →</span>
            </div>
          </Link>
        </div>

        <div className="mt-8 rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
            {activityLoading ? (
              <p className="text-gray-500 text-sm">Loading recent activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const style = activityStyle[activity.type]
                  return (
                    <div key={activity.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
                            {style.icon} {activity.type}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 truncate">{activity.title}</p>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{activity.subtitle}</p>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{formatActivityDate(activity.date)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
