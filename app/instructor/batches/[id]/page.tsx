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
  start_date: string
  end_date: string | null
  status: string
  schedule: string
  max_students: number
  zoom_link: string | null
  zoom_password: string | null
  telegram_group_id: string | null
}

interface Student {
  id: string
  student_name: string
  student_email: string
  enrolled_date: string
  status: string
}

interface AttendanceCode {
  id: string
  code: string
  generated_at: string
  valid_until: string
  is_active: boolean
  submission_count: number
}

export default function InstructorBatchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [batchId, setBatchId] = useState<string>('')
  
  const [batch, setBatch] = useState<BatchData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceCodes, setAttendanceCodes] = useState<AttendanceCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [attendanceCode, setAttendanceCode] = useState('')
  const [codeValidUntil, setCodeValidUntil] = useState('')

  useEffect(() => {
    params.then(p => setBatchId(p.id))
  }, [params])

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
    if (userProfile?.role === 'instructor' && batchId) {
      fetchData()
    }
  }, [userProfile, batchId])

  async function fetchData() {
    try {
      setLoading(true)
      
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
          max_students,
          zoom_link,
          zoom_password,
          telegram_group_id,
          instructor_id,
          courses!inner(title)
        `)
        .eq('id', batchId)
        .single()

      if (batchError) throw batchError

      // Check if this batch belongs to the logged-in instructor
      if (batchData.instructor_id !== userProfile?.id) {
        setError('You do not have access to this batch')
        return
      }

      setBatch({
        id: batchData.id,
        batch_name: batchData.batch_name,
        course_title: batchData.courses.title,
        start_date: batchData.start_date,
        end_date: batchData.end_date,
        status: batchData.status,
        schedule: batchData.schedule,
        max_students: batchData.max_students,
        zoom_link: batchData.zoom_link,
        zoom_password: batchData.zoom_password,
        telegram_group_id: batchData.telegram_group_id
      })

      // Fetch enrolled students
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_date,
          status,
          users!inner(id, name, email)
        `)
        .eq('batch_id', batchId)
        .order('enrolled_date', { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      const formattedStudents = (enrollmentsData || []).map((e: any) => ({
        id: e.id,
        student_name: e.users.name,
        student_email: e.users.email,
        enrolled_date: e.enrolled_date,
        status: e.status
      }))

      setStudents(formattedStudents)

      // Fetch attendance codes for this batch
      const { data: codesData, error: codesError } = await supabase
        .from('attendance_codes')
        .select('id, code, generated_at, valid_until, is_active')
        .eq('batch_id', batchId)
        .order('generated_at', { ascending: false })

      if (codesError) throw codesError

      // For each code, count how many students submitted it
      const codesWithSubmissions = await Promise.all(
        (codesData || []).map(async (code: any) => {
          const { count } = await supabase
            .from('attendance_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('attendance_code_id', code.id)

          return {
            id: code.id,
            code: code.code,
            generated_at: code.generated_at,
            valid_until: code.valid_until,
            is_active: code.is_active,
            submission_count: count || 0
          }
        })
      )

      setAttendanceCodes(codesWithSubmissions)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAttendanceCodes() {
    try {
      // Fetch attendance codes for this batch
      const { data: codesData, error: codesError } = await supabase
        .from('attendance_codes')
        .select('id, code, generated_at, valid_until, is_active')
        .eq('batch_id', batchId)
        .order('generated_at', { ascending: false })

      if (codesError) throw codesError

      // For each code, count how many students submitted it
      const codesWithSubmissions = await Promise.all(
        (codesData || []).map(async (code: any) => {
          const { count } = await supabase
            .from('attendance_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('attendance_code_id', code.id)

          return {
            id: code.id,
            code: code.code,
            generated_at: code.generated_at,
            valid_until: code.valid_until,
            is_active: code.is_active,
            submission_count: count || 0
          }
        })
      )

      setAttendanceCodes(codesWithSubmissions)
    } catch (err: any) {
      console.error('Error fetching attendance codes:', err)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const generateAttendanceCode = async () => {
    setGeneratingCode(true)
    setError('')
    
    try {
      // Generate a 6-character alphanumeric code
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      
      // Set valid until 3 days from now
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 3)
      
      // Save to database via API
      const response = await fetch('/api/instructor/attendance-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batchId,
          code: code,
          instructorId: userProfile?.id,
          validUntil: validUntil.toISOString(),
          notes: `Generated for ${batch?.batch_name}`
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save attendance code')
      }

      setAttendanceCode(code)
      setCodeValidUntil(validUntil.toISOString())
      setShowCodeModal(true)
      
      // Refresh attendance codes list in real-time
      await fetchAttendanceCodes()
      
    } catch (err: any) {
      setError(err.message)
      alert(`Error: ${err.message}`)
    } finally {
      setGeneratingCode(false)
    }
  }

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(attendanceCode)
    alert('Code copied to clipboard!')
  }

  const copyAttendanceCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'instructor' || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">{error || 'Batch not found'}</p>
          <Link href="/instructor/batches" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
            ← Back to My Batches
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/instructor" className="text-2xl font-bold text-purple-600 hover:text-purple-700 transition">
              LLPMM Campus
            </Link>
            <p className="text-sm text-gray-600 mt-1">Instructor Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Instructor: {userProfile.name}</span>
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
          <Link href="/instructor/batches" className="text-purple-600 hover:text-purple-700 text-sm font-semibold">
            ← Back to My Batches
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Batch Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{batch.batch_name}</h1>
              <p className="text-lg text-gray-600">{batch.course_title}</p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
              batch.status === 'upcoming'
                ? 'bg-green-100 text-green-700'
                : batch.status === 'ongoing'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {batch.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-600">Start Date</div>
                <div className="text-sm font-semibold text-gray-900">
                  {new Date(batch.start_date).toLocaleDateString('en-US', {
                    month: 'short',
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
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-600">Enrolled</div>
                <div className={`text-sm font-semibold ${
                  students.length >= batch.max_students ? 'text-red-600' : 'text-green-600'
                }`}>
                  {students.length} / {batch.max_students}
                </div>
              </div>
            </div>

            {batch.zoom_link && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Zoom Link</div>
                  <a
                    href={batch.zoom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Join Class →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {batch.telegram_group_id && (
          <div className="mb-6">
            <a
              href={`https://t.me/${batch.telegram_group_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-white text-purple-600 border-2 border-purple-600 px-6 py-4 rounded-xl hover:bg-purple-50 transition shadow-sm"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.672c-.138.643-.5.799-1.013.498l-2.791-2.058-1.346 1.296c-.149.149-.273.273-.562.273l.199-2.832 5.153-4.653c.224-.199-.05-.31-.347-.112L9.482 13.72l-2.742-.856c-.597-.187-.61-.597.126-.886l10.721-4.135c.497-.187.93.112.769.886z"/>
              </svg>
              <span className="font-semibold">Open Telegram Group</span>
            </a>
          </div>
        )}

        {/* Attendance Codes Section */}
        <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl mb-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Attendance Codes ({attendanceCodes.length})</h2>
                <p className="text-sm text-gray-600 mt-1">Active codes for this batch</p>
              </div>
              <button
                onClick={generateAttendanceCode}
                disabled={generatingCode}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-sm disabled:opacity-50 whitespace-nowrap text-sm font-semibold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{generatingCode ? 'Generating...' : 'Generate Code'}</span>
              </button>
            </div>

            {attendanceCodes.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-semibold mb-2">No attendance codes yet</p>
                <p className="text-sm">Generate attendance codes using the button above</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {attendanceCodes.map((code) => (
                  <div key={code.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="px-4 py-2 bg-purple-100 rounded-lg border-2 border-purple-300">
                            <span className="text-lg font-bold text-purple-700 font-mono">{code.code}</span>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 font-semibold">Generated</div>
                            <div className="text-sm text-gray-900 font-semibold">
                              {new Date(code.generated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>Valid until: {new Date(code.valid_until).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          <span>•</span>
                          <span>{code.submission_count} student{code.submission_count !== 1 ? 's' : ''} submitted</span>
                          {!code.is_active && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-semibold">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => copyAttendanceCode(code.code)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          copiedCode === code.code
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {copiedCode === code.code ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enrolled Students */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Enrolled Students ({students.length})</h2>
          </div>

          {students.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-semibold mb-2">No students enrolled yet</p>
              <p className="text-sm">Students will appear here once they enroll in this batch</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Enrolled Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {student.student_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.student_email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(student.enrolled_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Attendance Code Generated!
              </h3>
              <p className="text-sm text-gray-600">Share this code with your students</p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="text-xs text-purple-700 font-semibold mb-2">ATTENDANCE CODE</div>
                <div className="text-4xl font-bold text-purple-600 tracking-widest mb-3 font-mono">
                  {attendanceCode}
                </div>
                <div className="text-xs text-gray-600">
                  Valid until: {new Date(codeValidUntil).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-1">(3 days from now)</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyCodeToClipboard}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                📋 Copy Code
              </button>
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              💡 Students can submit this code within 3 days to mark their attendance
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
