'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface AttendanceRecord {
  id: string
  code: string
  batch_name: string
  course_title: string
  submitted_at: string
}

export default function StudentAttendance() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recentSubmissions, setRecentSubmissions] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
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
      fetchRecentSubmissions()
    }
  }, [userProfile])

  async function fetchRecentSubmissions() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      console.log('Fetching submissions for student:', userProfile.id)
      
      const { data, error: fetchError } = await supabase
        .from('attendance_submissions')
        .select(`
          id,
          submitted_at,
          batch_id,
          attendance_code_id
        `)
        .eq('student_id', userProfile.id)
        .order('submitted_at', { ascending: false })
        .limit(10)

      if (fetchError) {
        console.error('Fetch submissions error:', fetchError)
        throw fetchError
      }

      console.log('Raw submissions data:', data)

      if (!data || data.length === 0) {
        console.log('No submissions found')
        setRecentSubmissions([])
        return
      }

      // Fetch related data for each submission
      const formatted = await Promise.all(
        data.map(async (s: any) => {
          console.log('Processing submission:', s.id)
          
          // Fetch attendance code
          const { data: codeData, error: codeError } = await supabase
            .from('attendance_codes')
            .select('code')
            .eq('id', s.attendance_code_id)
            .single()

          if (codeError) {
            console.error('Code fetch error:', codeError)
          }
          console.log('Code data:', codeData)

          // Fetch batch info
          const { data: batchData, error: batchError } = await supabase
            .from('batches')
            .select('batch_name, course_id')
            .eq('id', s.batch_id)
            .single()

          if (batchError) {
            console.error('Batch fetch error:', batchError)
          }
          console.log('Batch data:', batchData)

          // Fetch course info
          let courseTitle = 'N/A'
          if (batchData?.course_id) {
            const { data: courseData, error: courseError } = await supabase
              .from('courses')
              .select('title')
              .eq('id', batchData.course_id)
              .single()

            if (courseError) {
              console.error('Course fetch error:', courseError)
            } else {
              courseTitle = courseData?.title || 'N/A'
            }
            console.log('Course data:', courseData)
          }

          const result = {
            id: s.id,
            code: codeData?.code || 'N/A',
            batch_name: batchData?.batch_name || 'N/A',
            course_title: courseTitle,
            submitted_at: s.submitted_at
          }
          console.log('Formatted submission:', result)
          return result
        })
      )

      console.log('Final formatted data:', formatted)
      setRecentSubmissions(formatted)
    } catch (err: any) {
      console.error('Fetch submissions error:', err)
      alert('Error loading submissions. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!code.trim()) {
      setError('Please enter an attendance code')
      return
    }

    if (code.length !== 6) {
      setError('Attendance code must be 6 characters')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/student/submit-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          studentId: userProfile?.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit attendance')
      }

      setSuccess(result.message || 'Attendance submitted successfully! ✓')
      setCode('')
      
      // Refresh submissions list
      setTimeout(() => {
        fetchRecentSubmissions()
        setSuccess('')
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
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
                    item.href === '/student/attendance'
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
                    item.href === '/student/attendance'
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/student" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Submit Attendance
          </h1>
          <p className="text-gray-600">Enter the 6-character code provided by your instructor</p>
        </div>

        {/* Submit Form */}
        <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl mb-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <form onSubmit={handleSubmit}>
            <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
              Attendance Code
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="A3X9K2"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono tracking-wider uppercase"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Codes are 6 characters (letters and numbers) and valid for 3 days
            </p>

            {/* Success Message */}
            {success && (
              <div className="mt-4 bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-lg">
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {success}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-gradient-to-r from-red-200 via-pink-200 to-red-200 p-[1px] rounded-lg">
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </form>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Recent Submissions</h2>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-semibold mb-2">No attendance submitted yet</p>
                <p className="text-sm">Enter a code above to mark your attendance</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentSubmissions.map((record) => (
                  <div key={record.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-green-100 text-green-700">
                            {record.code}
                          </span>
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="font-semibold text-gray-900">{record.course_title}</p>
                        <p className="text-sm text-gray-600">{record.batch_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(record.submitted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.submitted_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
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
