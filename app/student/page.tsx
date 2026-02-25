'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface EnrolledBatch {
  id: string
  enrollment_id: string
  batch_name: string
  course_title: string
  course_image: string | null
  start_date: string
  status: string
  instructor_name: string
  schedule: string
}

export default function StudentDashboard() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [enrolledBatches, setEnrolledBatches] = useState<EnrolledBatch[]>([])
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    activeCourses: 0,
    upcomingCourses: 0,
    certificates: 0
  })
  const [loading, setLoading] = useState(true)

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
        if (userProfile.role === 'admin') {
          router.push('/admin')
        } else if (userProfile.role === 'instructor') {
          router.push('/instructor')
        }
      }
    }
  }, [user, userProfile, authLoading, router])

  useEffect(() => {
    if (userProfile?.role === 'student') {
      fetchEnrollments()
    }
  }, [userProfile])

  async function fetchEnrollments() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      
      // Fetch enrollments for this student
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          batches!inner(
            id,
            batch_name,
            start_date,
            status,
            schedule,
            courses!inner(title, image_url),
            users!inner(name)
          )
        `)
        .eq('student_id', userProfile.id)
        .order('enrolled_date', { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      const formattedBatches = (enrollmentsData || []).map((e: any) => ({
        id: e.batches.id,
        enrollment_id: e.id,
        batch_name: e.batches.batch_name,
        course_title: e.batches.courses.title,
        course_image: e.batches.courses.image_url,
        start_date: e.batches.start_date,
        status: e.batches.status,
        instructor_name: e.batches.users.name,
        schedule: e.batches.schedule
      }))

      setEnrolledBatches(formattedBatches)

      // Calculate stats
      const activeCourses = formattedBatches.filter(b => b.status === 'ongoing').length
      const upcomingCourses = formattedBatches.filter(b => b.status === 'upcoming').length

      // Count certificates
      const { count: certificateCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userProfile.id)
        .eq('certificate', true)

      setStats({
        enrolledCourses: formattedBatches.length,
        activeCourses,
        upcomingCourses,
        certificates: certificateCount || 0
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
                  className="rounded-full"
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
                  className="font-medium text-sm transition-all bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-pink-600"
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

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 rounded-lg transition-all font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:bg-blue-50 hover:from-blue-700 hover:to-pink-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white mb-6 sm:mb-8 shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {userProfile.name}! 📚</h2>
          <p className="text-sm sm:text-base text-blue-100">Continue your learning journey with your enrolled courses.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl h-full">
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition h-full flex flex-col">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Enrolled Courses</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.enrolledCourses}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-xl h-full">
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition h-full flex flex-col">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active Courses</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeCourses}</p>
                  <p className="text-xs text-green-600">In progress</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 p-[1px] rounded-xl h-full">
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition h-full flex flex-col">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.upcomingCourses}</p>
                  <p className="text-xs text-orange-600">Starting soon</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-200 via-violet-200 to-purple-200 p-[1px] rounded-xl h-full">
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition h-full flex flex-col">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Certificates</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.certificates}</p>
                  <p className="text-xs text-purple-600">Earned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
            <Link 
              href="/student/courses"
              className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition group block flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center gap-3 sm:gap-4 mb-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition flex-shrink-0">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">📚 My Courses</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-4">View your enrolled courses, schedules, and access class materials</p>
              </div>
              <span className="text-blue-600 text-xs sm:text-sm font-semibold group-hover:translate-x-2 inline-block transition">View All Courses →</span>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-xl">
            <Link
              href="/student/attendance"
              className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition group block flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center gap-3 sm:gap-4 mb-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition flex-shrink-0">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">✅ Submit Attendance</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-4">Enter attendance codes provided by your instructor</p>
              </div>
              <span className="text-green-600 text-xs sm:text-sm font-semibold group-hover:translate-x-2 inline-block transition">Submit Code →</span>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 p-[1px] rounded-xl">
            <Link
              href="/student/assignments"
              className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition group block flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center gap-3 sm:gap-4 mb-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition flex-shrink-0">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">📝 My Assignments</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-4">Submit assignments and view your grades</p>
              </div>
              <span className="text-orange-600 text-xs sm:text-sm font-semibold group-hover:translate-x-2 inline-block transition">View Assignments →</span>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
            <Link
              href="/student/payments"
              className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition group block flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center gap-3 sm:gap-4 mb-3">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition flex-shrink-0">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">💳 My Payments</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-4">View payment status, installment schedules, and history</p>
              </div>
              <span className="text-purple-600 text-xs sm:text-sm font-semibold group-hover:translate-x-2 inline-block transition">View Payments →</span>
            </Link>
          </div>
        </div>

        {/* My Enrolled Courses */}
        <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">My Enrolled Courses</h3>
            <Link 
              href="/student/courses"
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All →
            </Link>
          </div>
          
          {enrolledBatches.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
              <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-base sm:text-lg font-semibold mb-2">No courses enrolled yet</p>
              <p className="text-xs sm:text-sm mb-4">Contact admin to enroll in a course</p>
              <Link 
                href="/courses"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-xs sm:text-sm"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {enrolledBatches.slice(0, 5).map((batch) => (
                <Link
                  key={batch.id}
                  href={`/student/courses/${batch.id}`}
                  className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 group"
                >
                  {/* Course Image */}
                  {batch.course_image ? (
                    <img
                      src={batch.course_image}
                      alt={batch.course_title}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 sm:w-10 h-8 sm:h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}

                  {/* Course Info */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-blue-600 transition">
                      {batch.course_title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{batch.batch_name}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        batch.status === 'upcoming'
                          ? 'bg-orange-100 text-orange-700'
                          : batch.status === 'ongoing'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {batch.status}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        Instructor: {batch.instructor_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(batch.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
