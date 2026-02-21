'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface BatchData {
  id: string
  batch_name: string
  course_title: string
  course_description: string | null
  course_image: string | null
  start_date: string
  end_date: string | null
  status: string
  schedule: string
  instructor_name: string
  zoom_link: string | null
  zoom_password: string | null
  telegram_group_id: string | null
}

interface Classmate {
  id: string
  name: string
  email: string
}

interface PerformanceStats {
  attendance: {
    total: number
    submitted: number
    rate: number
  }
  assignments: {
    total: number
    submitted: number
    graded: number
    pending: number
    avgScore: number
    rate: number
  }
}

interface RecentActivity {
  type: 'attendance' | 'assignment'
  title: string
  date: string
  status: string
  score?: number
  maxScore?: number
}

interface CertificateState {
  enrollmentId: string
  attendanceRate: number
  assignmentRate: number
  batchEnded: boolean
  certificate: boolean
}

export default function StudentCourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [batchId, setBatchId] = useState<string>('')
  
  const [batch, setBatch] = useState<BatchData | null>(null)
  const [certificate, setCertificate] = useState<CertificateState | null>(null)
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [performance, setPerformance] = useState<PerformanceStats>({
    attendance: { total: 0, submitted: 0, rate: 0 },
    assignments: { total: 0, submitted: 0, graded: 0, pending: 0, avgScore: 0, rate: 0 }
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then(p => setBatchId(p.id))
  }, [params])

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
    if (userProfile?.role === 'student' && batchId) {
      fetchData()
    }
  }, [userProfile, batchId])

  async function fetchData() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      
      // Check enrollment
      const { data: enrollmentCheck, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, certificate')
        .eq('student_id', userProfile.id)
        .eq('batch_id', batchId)
        .single()

      if (enrollmentError || !enrollmentCheck) {
        setError('You are not enrolled in this batch')
        return
      }

      const { data: metricsData } = await supabase
        .rpc('calculate_enrollment_performance', { p_enrollment_id: enrollmentCheck.id })

      const { data: refreshedCertificate } = await supabase
        .rpc('refresh_enrollment_certificate_status', { p_enrollment_id: enrollmentCheck.id })

      const metric = metricsData?.[0]
      setCertificate({
        enrollmentId: enrollmentCheck.id,
        attendanceRate: Number(metric?.attendance_rate || 0),
        assignmentRate: Number(metric?.assignment_rate || 0),
        batchEnded: Boolean(metric?.batch_ended),
        certificate: typeof refreshedCertificate === 'boolean' ? refreshedCertificate : Boolean(enrollmentCheck.certificate),
      })

      // Fetch batch info
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select(`
          id,
          batch_name,
          start_date,
          end_date,
          status,
          schedule,
          zoom_link,
          zoom_password,
          telegram_group_id,
          courses!inner(title, description, image_url),
          users!inner(name)
        `)
        .eq('id', batchId)
        .single()

      if (batchError) throw batchError

      const course = Array.isArray(batchData.courses) ? batchData.courses[0] : batchData.courses
      const instructor = Array.isArray(batchData.users) ? batchData.users[0] : batchData.users

      setBatch({
        id: batchData.id,
        batch_name: batchData.batch_name,
        course_title: course?.title ?? 'Untitled Course',
        course_description: course?.description ?? null,
        course_image: course?.image_url ?? null,
        start_date: batchData.start_date,
        end_date: batchData.end_date,
        status: batchData.status,
        schedule: batchData.schedule,
        instructor_name: instructor?.name ?? 'Unknown Instructor',
        zoom_link: batchData.zoom_link,
        zoom_password: batchData.zoom_password,
        telegram_group_id: batchData.telegram_group_id
      })

      // Fetch classmates
      const { data: classmatesData, error: classmatesError } = await supabase
        .from('enrollments')
        .select(`users!inner(id, name, email)`)
        .eq('batch_id', batchId)
        .neq('student_id', userProfile.id)

      if (classmatesError) throw classmatesError

      setClassmates((classmatesData || []).map((e: any) => ({
        id: e.users.id,
        name: e.users.name,
        email: e.users.email
      })))

      // Fetch performance stats
      await fetchPerformanceStats()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPerformanceStats() {
    if (!userProfile?.id) return

    try {
      // Attendance Stats
      const { count: totalAttendanceCodes } = await supabase
        .from('attendance_codes')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId)

      const { count: submittedAttendance } = await supabase
        .from('attendance_submissions')
        .select('attendance_codes!inner(batch_id)', { count: 'exact', head: true })
        .eq('student_id', userProfile.id)
        .eq('attendance_codes.batch_id', batchId)

      const attendanceRate = totalAttendanceCodes && totalAttendanceCodes > 0
        ? Math.round((submittedAttendance || 0) / totalAttendanceCodes * 100)
        : 0

      // Assignment Stats
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('id, max_score')
        .eq('batch_id', batchId)

      const totalAssignments = assignmentsData?.length || 0

      let submittedCount = 0
      let gradedCount = 0
      let pendingCount = 0
      let totalScore = 0
      let totalMaxScore = 0
      const activities: RecentActivity[] = []

      if (totalAssignments > 0 && assignmentsData) {
        for (const assignment of assignmentsData) {
          const { data: submissionData } = await supabase
            .from('assignment_submissions')
            .select('*')
            .eq('assignment_id', assignment.id)
            .eq('student_id', userProfile.id)
            .single()

          if (submissionData) {
            submittedCount++
            if (submissionData.status === 'graded') {
              gradedCount++
              if (submissionData.score !== null) {
                totalScore += submissionData.score
                totalMaxScore += assignment.max_score
              }
            } else {
              pendingCount++
            }
          }
        }
      }

      const avgScore = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0

      const assignmentRate = totalAssignments > 0
        ? Math.round((submittedCount / totalAssignments) * 100)
        : 0

      // Recent Attendance (last 5)
      const { data: recentAttendanceData } = await supabase
        .from('attendance_submissions')
        .select(`
          id,
          submitted_at,
          attendance_codes!inner(code, batch_id)
        `)
        .eq('student_id', userProfile.id)
        .eq('attendance_codes.batch_id', batchId)
        .order('submitted_at', { ascending: false })
        .limit(5)

      const attendanceActivities: RecentActivity[] = (recentAttendanceData || []).map((a: any) => ({
        type: 'attendance' as const,
        title: `Attendance Code: ${a.attendance_codes.code}`,
        date: a.submitted_at,
        status: 'submitted'
      }))

      // Recent Assignments (last 5)
      const { data: recentAssignmentsData } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          submitted_at,
          status,
          score,
          assignments!inner(title, max_score, batch_id)
        `)
        .eq('student_id', userProfile.id)
        .eq('assignments.batch_id', batchId)
        .order('submitted_at', { ascending: false })
        .limit(5)

      const assignmentActivities: RecentActivity[] = (recentAssignmentsData || []).map((a: any) => ({
        type: 'assignment' as const,
        title: a.assignments.title,
        date: a.submitted_at,
        status: a.status,
        score: a.score,
        maxScore: a.assignments.max_score
      }))

      // Combine and sort by date
      const allActivities = [...attendanceActivities, ...assignmentActivities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)

      setPerformance({
        attendance: {
          total: totalAttendanceCodes || 0,
          submitted: submittedAttendance || 0,
          rate: attendanceRate
        },
        assignments: {
          total: totalAssignments,
          submitted: submittedCount,
          graded: gradedCount,
          pending: pendingCount,
          avgScore: avgScore,
          rate: assignmentRate
        }
      })

      setRecentActivity(allActivities)

    } catch (err: any) {
      console.error('Performance fetch error:', err)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'student' || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">{error || 'Course not found'}</p>
          <Link href="/student/courses" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to My Courses
          </Link>
        </div>
      </div>
    )
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
          <Link href="/student/courses" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to My Courses
          </Link>
        </div>

        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl mb-6">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Course Image */}
            <div className="lg:col-span-1">
              {batch.course_image ? (
                <img
                  src={batch.course_image}
                  alt={batch.course_title}
                  className="w-full h-64 lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 lg:h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <svg className="w-24 h-24 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="lg:col-span-2 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{batch.course_title}</h1>
                  <p className="text-lg text-gray-600">{batch.batch_name}</p>
                </div>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  batch.status === 'upcoming'
                    ? 'bg-orange-100 text-orange-700'
                    : batch.status === 'ongoing'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {batch.status}
                </span>
              </div>

              {batch.course_description && (
                <p className="text-gray-700 mb-6">{batch.course_description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Instructor</div>
                    <div className="text-sm font-semibold text-gray-900">{batch.instructor_name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Start Date</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(batch.start_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Schedule</div>
                    <div className="text-sm font-semibold text-gray-900">{batch.schedule}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Classmates</div>
                    <div className="text-sm font-semibold text-gray-900">{classmates.length} students</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {batch.zoom_link && (
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl mb-6">
            <a
              href={batch.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 bg-white text-blue-600 px-6 py-5 rounded-xl hover:bg-blue-50 transition shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="font-semibold">Join Zoom Class</div>
                  {batch.zoom_password && (
                    <div className="text-xs">{batch.zoom_password}</div>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        )}

        {/* Performance Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Performance</h2>

          {certificate && (
            <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Certificate Eligibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-700">Attendance</div>
                    <div className="text-lg font-bold text-blue-900">{certificate.attendanceRate.toFixed(2)}%</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-700">Assignment</div>
                    <div className="text-lg font-bold text-purple-900">{certificate.assignmentRate.toFixed(2)}%</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-xs text-amber-700">Batch Ended</div>
                    <div className="text-lg font-bold text-amber-900">{certificate.batchEnded ? 'Yes' : 'No'}</div>
                  </div>
                  <div className={`${certificate.certificate ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-3`}>
                    <div className={`text-xs ${certificate.certificate ? 'text-green-700' : 'text-gray-600'}`}>Status</div>
                    <div className={`text-lg font-bold ${certificate.certificate ? 'text-green-800' : 'text-gray-700'}`}>
                      {certificate.certificate ? 'Eligible' : 'Not Eligible'}
                    </div>
                  </div>
                </div>

                {certificate.certificate && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Certificate Preview</div>
                    <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl inline-block">
                      <img
                        src={`/api/student/certificate/${certificate.enrollmentId}?preview=1`}
                        alt="Certificate preview"
                        className="w-full max-w-md rounded-xl bg-white"
                      />
                    </div>
                  </div>
                )}

                {certificate.certificate ? (
                  <a
                    href={`/api/student/certificate/${certificate.enrollmentId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                  >
                    Download Certificate
                  </a>
                ) : (
                  <p className="text-sm text-gray-600">
                    Certificate is available after class end date and when both attendance and assignment performance are at least 90%.
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Attendance Performance */}
            <div className="bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-xl h-full">
              <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Attendance</h3>
                      <p className="text-sm text-gray-600">
                        {performance.attendance.submitted} / {performance.attendance.total} classes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">{performance.attendance.rate}%</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${performance.attendance.rate}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {performance.attendance.total - performance.attendance.submitted} classes missed
                  </span>
                  <Link 
                    href="/student/attendance"
                    className="text-green-600 hover:text-green-700 font-semibold"
                  >
                    Submit Code →
                  </Link>
                </div>
              </div>
            </div>

          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl h-full">
            <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Assignments</h3>
                    <p className="text-sm text-gray-600">
                      {performance.assignments.submitted} / {performance.assignments.total} submitted
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{performance.assignments.rate}%</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${performance.assignments.rate}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-xs text-gray-600">Pending</div>
                  <div className="text-lg font-bold text-orange-600">{performance.assignments.pending}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Graded</div>
                  <div className="text-lg font-bold text-green-600">{performance.assignments.graded}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Avg Score</div>
                  <div className="text-lg font-bold text-purple-600">{performance.assignments.avgScore}%</div>
                </div>
              </div>
              
              <Link 
                href="/student/assignments"
                className="mt-auto self-end text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View All Assignments →
              </Link>
            </div>
          </div>
        </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'attendance' 
                        ? 'bg-green-100' 
                        : activity.status === 'graded'
                        ? 'bg-blue-100'
                        : 'bg-yellow-100'
                    }`}>
                      {activity.type === 'attendance' ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{activity.title}</div>
                      <div className="text-xs text-gray-600">{formatDate(activity.date)}</div>
                    </div>
                    <div className="text-right">
                      {activity.type === 'assignment' && activity.status === 'graded' && activity.score !== undefined ? (
                        <div className="text-sm font-bold text-green-600">
                          {activity.score}/{activity.maxScore}
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          activity.status === 'graded' 
                            ? 'bg-green-100 text-green-700'
                            : activity.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {activity.status === 'submitted' ? '✓ Submitted' : 
                           activity.status === 'graded' ? '✓ Graded' :
                           activity.status === 'pending' ? 'Pending' : activity.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Access Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {batch.telegram_group_id && (
            <div className="bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 p-[1px] rounded-xl">
              <a
                href={`https://t.me/${batch.telegram_group_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-white text-indigo-600 px-6 py-4 rounded-xl hover:bg-indigo-50 transition shadow-sm group"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.672c-.138.643-.5.799-1.013.498l-2.791-2.058-1.346 1.296c-.149.149-.273.273-.562.273l.199-2.832 5.153-4.653c.224-.199-.05-.31-.347-.112L9.482 13.72l-2.742-.856c-.597-.187-.61-.597.126-.886l10.721-4.135c.497-.187.93.112.769.886z" />
                </svg>
                <div className="text-left">
                  <div className="font-semibold">Join Telegram Group</div>
                  <div className="text-xs">Class discussions & updates</div>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Classmates */}
        <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 p-[1px] rounded-xl">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Classmates ({classmates.length})</h2>
            </div>

            {classmates.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-lg font-semibold mb-2">No other students yet</p>
                <p className="text-sm">You're the first one enrolled in this batch!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {classmates.map((classmate) => (
                  <div key={classmate.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{classmate.name}</div>
                      <div className="text-xs text-gray-600 truncate">{classmate.email}</div>
                    </div>
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
