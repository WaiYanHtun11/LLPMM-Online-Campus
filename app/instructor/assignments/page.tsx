'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import InstructorNavbar from '@/components/InstructorNavbar'

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  max_score: number
  batch_name: string
  course_title: string
  submission_count: number
  pending_count: number
  graded_count: number
  is_active: boolean
}

export default function InstructorAssignments() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAssignments: 0,
    pendingGrading: 0,
    totalSubmissions: 0
  })

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
      fetchAssignments()
    }
  }, [userProfile])

  async function fetchAssignments() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, title, description, due_date, max_score, batch_id, is_active')
        .eq('instructor_id', userProfile.id)
        .order('due_date', { ascending: false })

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

          // Count submissions
          const { count: totalCount } = await supabase
            .from('assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', a.id)

          const { count: pendingCount } = await supabase
            .from('assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', a.id)
            .eq('status', 'pending')

          const { count: gradedCount } = await supabase
            .from('assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', a.id)
            .eq('status', 'graded')

          return {
            id: a.id,
            title: a.title,
            description: a.description,
            due_date: a.due_date,
            max_score: a.max_score,
            batch_name: batchData?.batch_name || 'N/A',
            course_title: courseTitle,
            submission_count: totalCount || 0,
            pending_count: pendingCount || 0,
            graded_count: gradedCount || 0,
            is_active: a.is_active
          }
        })
      )

      setAssignments(formatted)

      // Calculate stats
      const totalPending = formatted.reduce((sum, a) => sum + a.pending_count, 0)
      const totalSubs = formatted.reduce((sum, a) => sum + a.submission_count, 0)

      setStats({
        totalAssignments: formatted.length,
        pendingGrading: totalPending,
        totalSubmissions: totalSubs
      })

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'instructor') {
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

        {/* Header with Create Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              My Assignments
            </h1>
            <p className="text-gray-600">Create and manage assignments for your batches</p>
          </div>
          <Link
            href="/instructor/assignments/create"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
          >
            + Create Assignment
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Grading</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingGrading}</p>
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
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">All Assignments</h2>
            </div>

            {assignments.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-semibold mb-2">No assignments yet</p>
                <p className="text-sm mb-4">Create your first assignment to get started</p>
                <Link
                  href="/instructor/assignments/create"
                  className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Create Assignment
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-purple-100/80 p-[1px]">
                    <Link
                      href={`/instructor/assignments/${assignment.id}/submissions`}
                      className="block px-6 py-4 bg-white hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                            {isOverdue(assignment.due_date) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                Overdue
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{assignment.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{assignment.course_title} - {assignment.batch_name}</span>
                            <span>•</span>
                            <span>Due: {formatDate(assignment.due_date)}</span>
                            <span>•</span>
                            <span>Max: {assignment.max_score} pts</span>
                          </div>
                        </div>
                        
                        <div className="ml-6 text-right">
                          <div className="flex items-center gap-4 mb-2">
                            <div>
                              <p className="text-sm text-gray-600">Submissions</p>
                              <p className="text-xl font-bold text-gray-900">{assignment.submission_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-orange-600">Pending</p>
                              <p className="text-xl font-bold text-orange-600">{assignment.pending_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-green-600">Graded</p>
                              <p className="text-xl font-bold text-green-600">{assignment.graded_count}</p>
                            </div>
                          </div>
                          <span className="text-purple-600 text-sm font-semibold">View Submissions →</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
