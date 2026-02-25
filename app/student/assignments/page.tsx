'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  max_score: number
  batch_name: string
  course_title: string
  submitted: boolean
  score: number | null
  status: string | null
}

export default function StudentAssignments() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/student/courses', label: 'My Courses' },
    { href: '/student/attendance', label: 'Attendance' },
    { href: '/student/assignments', label: 'Assignments' },
    { href: '/student/payments', label: 'Payments' },
  ]

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
      fetchAssignments()
    }
  }, [userProfile])

  async function fetchAssignments() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      
      // Get student's enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('batch_id')
        .eq('student_id', userProfile.id)

      if (enrollmentsError) throw enrollmentsError

      const batchIds = (enrollmentsData || []).map((e: any) => e.batch_id)

      if (batchIds.length === 0) {
        setAssignments([])
        return
      }

      // Fetch assignments for enrolled batches
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, title, description, due_date, max_score, batch_id')
        .in('batch_id', batchIds)
        .eq('is_active', true)
        .order('due_date', { ascending: true })

      if (assignmentsError) throw assignmentsError

      const formatted = await Promise.all(
        (assignmentsData || []).map(async (a: any) => {
          // Fetch batch and course info
          const { data: batchData } = await supabase
            .from('batches')
            .select('batch_name, course_id')
            .eq('id', a.batch_id)
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

          // Check if student has submitted
          const { data: submissionData } = await supabase
            .from('assignment_submissions')
            .select('score, status')
            .eq('assignment_id', a.id)
            .eq('student_id', userProfile.id)
            .single()

          return {
            id: a.id,
            title: a.title,
            description: a.description,
            due_date: a.due_date,
            max_score: a.max_score,
            batch_name: batchData?.batch_name || 'N/A',
            course_title: courseTitle,
            submitted: !!submissionData,
            score: submissionData?.score || null,
            status: submissionData?.status || null
          }
        })
      )

      setAssignments(formatted)

    } catch (err: any) {
      console.error('Fetch assignments error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'pending') return !a.submitted
    if (filter === 'submitted') return a.submitted && a.status === 'pending'
    if (filter === 'graded') return a.status === 'graded'
    return true
  })

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => !a.submitted).length,
    submitted: assignments.filter((a) => a.submitted && a.status === 'pending').length,
    graded: assignments.filter((a) => a.status === 'graded').length
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
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <Link href="/">
                <Image
                  src="/llpmm-logo.jpg"
                  alt="LLPMM Logo"
                  width={44}
                  height={44}
                  className="rounded-full ring-2 ring-blue-100"
                />
              </Link>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">Student Portal</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">LLPMM Online Campus</p>
              </div>
            </div>

            <div className="hidden md:flex gap-6 items-center">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors font-medium text-sm ${
                    item.href === '/student/assignments'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{userProfile.name}</p>
                <p className="text-xs text-gray-600 truncate">{userProfile.email}</p>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 sm:hidden truncate">{userProfile.name}</p>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm font-semibold whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                    item.href === '/student/assignments'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

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
            My Assignments
          </h1>
          <p className="text-gray-600">View and submit assignments for your courses</p>
        </div>

        {/* Filter Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`w-full p-4 rounded-xl transition ${
                filter === 'all'
                  ? 'bg-blue-50'
                  : 'bg-white hover:bg-blue-50'
              }`}
            >
              <p className="text-sm text-gray-600">All Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </button>
          </div>

          <div className="bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 p-[1px] rounded-xl">
            <button
              onClick={() => setFilter('pending')}
              className={`w-full p-4 rounded-xl transition ${
                filter === 'pending'
                  ? 'bg-orange-50'
                  : 'bg-white hover:bg-orange-50'
              }`}
            >
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </button>
          </div>

          <div className="bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-200 p-[1px] rounded-xl">
            <button
              onClick={() => setFilter('submitted')}
              className={`w-full p-4 rounded-xl transition ${
                filter === 'submitted'
                  ? 'bg-yellow-50'
                  : 'bg-white hover:bg-yellow-50'
              }`}
            >
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.submitted}</p>
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-200 via-emerald-200 to-green-200 p-[1px] rounded-xl">
            <button
              onClick={() => setFilter('graded')}
              className={`w-full p-4 rounded-xl transition ${
                filter === 'graded'
                  ? 'bg-green-50'
                  : 'bg-white hover:bg-green-50'
              }`}
            >
              <p className="text-sm text-gray-600">Graded</p>
              <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
            </button>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 p-[1px] rounded-xl">
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
                </p>
                <p className="text-sm text-gray-600">Check back later for new assignments from your instructors</p>
              </div>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 p-[1px] rounded-xl">
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
                      {assignment.submitted ? (
                        assignment.status === 'graded' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            ✓ Graded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                            Submitted
                          </span>
                        )
                      ) : isOverdue(assignment.due_date) ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{assignment.course_title} - {assignment.batch_name}</span>
                      <span>•</span>
                      <span>Due: {formatDate(assignment.due_date)}</span>
                      <span>•</span>
                      <span>Max: {assignment.max_score} pts</span>
                      {assignment.score !== null && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-green-600">Score: {assignment.score}/{assignment.max_score}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    {!assignment.submitted ? (
                      <Link
                        href={`/student/assignments/${assignment.id}/submit`}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        Submit
                      </Link>
                    ) : (
                      <Link
                        href={`/student/assignments/${assignment.id}/submission`}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
