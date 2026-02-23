'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface AttendanceCode {
  id: string
  code: string
  batch_name: string
  course_title: string
  generated_at: string
  valid_until: string
  is_active: boolean
  submission_count: number
  submissions: {
    student_name: string
    student_email: string
    submitted_at: string
  }[]
}

interface BatchOption {
  id: string
  batch_name: string
}

export default function InstructorAttendanceHistory() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [codes, setCodes] = useState<AttendanceCode[]>([])
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)

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
      fetchBatches()
      fetchAttendanceCodes()
    }
  }, [userProfile, selectedBatch])

  async function fetchBatches() {
    if (!userProfile?.id) return
    
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, batch_name')
        .eq('instructor_id', userProfile.id)
        .order('start_date', { ascending: false })

      if (error) throw error

      setBatches(data || [])
    } catch (err: any) {
      console.error('Fetch batches error:', err)
    }
  }

  async function fetchAttendanceCodes() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      
      let query = supabase
        .from('attendance_codes')
        .select(`
          id,
          code,
          generated_at,
          valid_until,
          is_active,
          batches!inner(
            id,
            batch_name,
            instructor_id,
            courses!inner(title)
          )
        `)
        .eq('batches.instructor_id', userProfile.id)
        .order('generated_at', { ascending: false })

      if (selectedBatch !== 'all') {
        query = query.eq('batch_id', selectedBatch)
      }

      const { data: codesData, error: codesError } = await query

      if (codesError) throw codesError

      // Fetch submissions for each code
      const codesWithSubmissions = await Promise.all(
        (codesData || []).map(async (code: any) => {
          const codeBatch = Array.isArray(code.batches) ? code.batches[0] : code.batches
          const codeCourse = Array.isArray(codeBatch?.courses) ? codeBatch.courses[0] : codeBatch?.courses
          const { data: submissions, error: subsError } = await supabase
            .from('attendance_submissions')
            .select(`
              submitted_at,
              users!inner(name, email)
            `)
            .eq('attendance_code_id', code.id)
            .order('submitted_at', { ascending: false })

          if (subsError) {
            console.error('Fetch submissions error:', subsError)
            return {
              id: code.id,
              code: code.code,
              batch_name: codeBatch?.batch_name || 'Unknown Batch',
              course_title: codeCourse?.title || 'Unknown Course',
              generated_at: code.generated_at,
              valid_until: code.valid_until,
              is_active: code.is_active,
              submission_count: 0,
              submissions: []
            }
          }

          return {
            id: code.id,
            code: code.code,
            batch_name: codeBatch?.batch_name || 'Unknown Batch',
            course_title: codeCourse?.title || 'Unknown Course',
            generated_at: code.generated_at,
            valid_until: code.valid_until,
            is_active: code.is_active,
            submission_count: submissions?.length || 0,
            submissions: (submissions || []).map((s: any) => ({
              student_name: (Array.isArray(s.users) ? s.users[0] : s.users)?.name || 'Unknown Student',
              student_email: (Array.isArray(s.users) ? s.users[0] : s.users)?.email || '',
              submitted_at: s.submitted_at
            }))
          }
        })
      )

      setCodes(codesWithSubmissions)
    } catch (err: any) {
      console.error('Fetch attendance codes error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const toggleExpand = (codeId: string) => {
    setExpandedCode(expandedCode === codeId ? null : codeId)
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
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
          <Link href="/instructor" className="text-purple-600 hover:text-purple-700 text-sm font-semibold">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Attendance History
          </h1>
          <p className="text-gray-600">View all attendance codes and student submissions</p>
        </div>

        {/* Filter */}
        <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label htmlFor="batch-filter" className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Batch
            </label>
            <select
              id="batch-filter"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Codes</p>
                  <p className="text-2xl font-bold text-gray-900">{codes.length}</p>
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
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {codes.reduce((sum, code) => sum + code.submission_count, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Codes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {codes.filter(c => c.is_active && !isExpired(c.valid_until)).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Codes List */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Attendance Codes</h2>
            </div>

            {codes.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-semibold mb-2">No attendance codes yet</p>
                <p className="text-sm">Generate your first attendance code from a batch detail page</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {codes.map((code) => (
                  <div key={code.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-4 py-2 rounded-lg text-lg font-mono font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                          {code.code}
                        </span>
                        
                        {code.is_active && !isExpired(code.valid_until) && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                            Active
                          </span>
                        )}
                        
                        {isExpired(code.valid_until) && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-semibold">
                            Expired
                          </span>
                        )}
                        
                        {!code.is_active && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                            Deactivated
                          </span>
                        )}
                      </div>
                      
                      <p className="font-semibold text-gray-900">{code.course_title}</p>
                      <p className="text-sm text-gray-600">{code.batch_name}</p>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>
                          Generated: {new Date(code.generated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>
                          Valid until: {new Date(code.valid_until).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(code.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-semibold text-sm"
                    >
                      <span>{code.submission_count} Submission{code.submission_count !== 1 ? 's' : ''}</span>
                      <svg
                        className={`w-5 h-5 transition-transform ${expandedCode === code.id ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Submissions List */}
                  {expandedCode === code.id && (
                    <div className="mt-4 pl-4 border-l-4 border-purple-200">
                      {code.submissions.length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-2">No submissions yet</p>
                      ) : (
                        <div className="space-y-2">
                          {code.submissions.map((submission, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{submission.student_name}</p>
                                  <p className="text-xs text-gray-600">{submission.student_email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-600">
                                  {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(submission.submitted_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
