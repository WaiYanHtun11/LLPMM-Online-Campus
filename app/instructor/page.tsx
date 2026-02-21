'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface BatchInfo {
  id: string
  batch_name: string
  course_title: string
  start_date: string
  status: string
  enrollment_count: number
}

export default function InstructorDashboard() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [batches, setBatches] = useState<BatchInfo[]>([])
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalStudents: 0,
    activeBatches: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'instructor') {
        if (userProfile.role === 'admin') {
          router.push('/admin')
        } else if (userProfile.role === 'student') {
          router.push('/student')
        }
      }
    }
  }, [user, userProfile, authLoading, router])

  useEffect(() => {
    if (userProfile?.role === 'instructor') {
      fetchData()
    }
  }, [userProfile])

  async function fetchData() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)

      // Fetch batches assigned to this instructor
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select(`
          id,
          batch_name,
          start_date,
          status,
          courses!inner(title)
        `)
        .eq('instructor_id', userProfile.id)
        .order('start_date', { ascending: false })

      if (batchesError) throw batchesError

      // Fetch enrollment counts for each batch
      const batchesWithCounts = await Promise.all(
        (batchesData || []).map(async (batch: any) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id)

          return {
            id: batch.id,
            batch_name: batch.batch_name,
            course_title: batch.courses.title,
            start_date: batch.start_date,
            status: batch.status,
            enrollment_count: count || 0
          }
        })
      )

      setBatches(batchesWithCounts)

      // Calculate stats
      const totalStudents = batchesWithCounts.reduce((sum, b) => sum + b.enrollment_count, 0)
      const activeBatches = batchesWithCounts.filter(b => b.status === 'ongoing').length

      setStats({
        totalBatches: batchesWithCounts.length,
        totalStudents,
        activeBatches
      })

    } catch (err: any) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading || loading || !userProfile) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                <h1 className="text-2xl font-bold text-gray-900">Instructor Portal</h1>
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
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {userProfile.name}! 🎓</h2>
          <p className="text-purple-100">Manage your batches, track attendance, and review student progress.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">My Batches</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBatches}</p>
                  <p className="text-xs text-purple-600">{stats.activeBatches} active</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  <p className="text-xs text-blue-600">Across all batches</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-green-600">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link 
            href="/instructor/batches"
            className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-lg transition group"
          >
            <div className="bg-white rounded-xl p-6 h-full">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">📆 My Batches</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">View and manage your assigned batches, check enrollments, and track progress</p>
              <span className="text-purple-600 text-sm font-semibold group-hover:translate-x-2 inline-block transition">View All Batches →</span>
            </div>
          </Link>

          <Link 
            href="/instructor/attendance"
            className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-lg transition group"
          >
            <div className="bg-white rounded-xl p-6 h-full">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">✅ Attendance History</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">View all attendance codes and student submissions</p>
              <span className="text-green-600 text-sm font-semibold group-hover:translate-x-2 inline-block transition">View History →</span>
            </div>
          </Link>

          <Link 
            href="/instructor/assignments"
            className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-lg transition group"
          >
            <div className="bg-white rounded-xl p-6 h-full">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">📝 Assignments</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Create assignments and grade student submissions</p>
              <span className="text-blue-600 text-sm font-semibold group-hover:translate-x-2 inline-block transition">Manage Assignments →</span>
            </div>
          </Link>
        </div>

        {/* Recent Batches */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">My Recent Batches</h3>
              <Link 
                href="/instructor/batches"
                className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
              >
                View All →
              </Link>
            </div>
          
            {batches.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-semibold mb-2">No batches assigned yet</p>
                <p className="text-sm">Contact admin to get assigned to a batch</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {batches.slice(0, 5).map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/instructor/batches/${batch.id}`}
                    className="px-6 py-4 hover:bg-gray-50 transition flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                        {batch.batch_name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{batch.course_title}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          batch.status === 'upcoming'
                            ? 'bg-green-100 text-green-700'
                            : batch.status === 'ongoing'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {batch.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {batch.enrollment_count} student{batch.enrollment_count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-500">
                          Starts: {new Date(batch.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
