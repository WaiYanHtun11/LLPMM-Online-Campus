'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface EnrolledBatch {
  id: string
  enrollment_id: string
  batch_name: string
  course_title: string
  course_image: string | null
  course_description: string | null
  start_date: string
  end_date: string | null
  status: string
  instructor_name: string
  schedule: string
  zoom_link: string | null
  telegram_group_id: string | null
}

export default function StudentCourses() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [enrolledBatches, setEnrolledBatches] = useState<EnrolledBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

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
            end_date,
            status,
            schedule,
            zoom_link,
            telegram_group_id,
            courses!inner(title, description, image_url),
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
        course_description: e.batches.courses.description,
        start_date: e.batches.start_date,
        end_date: e.batches.end_date,
        status: e.batches.status,
        instructor_name: e.batches.users.name,
        schedule: e.batches.schedule,
        zoom_link: e.batches.zoom_link,
        telegram_group_id: e.batches.telegram_group_id
      }))

      setEnrolledBatches(formattedBatches)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  // Filter batches
  const filteredBatches = enrolledBatches.filter(batch => {
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter
    const matchesSearch = batch.batch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         batch.course_title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Calculate stats
  const stats = {
    all: enrolledBatches.length,
    upcoming: enrolledBatches.filter(b => b.status === 'upcoming').length,
    ongoing: enrolledBatches.filter(b => b.status === 'ongoing').length,
    completed: enrolledBatches.filter(b => b.status === 'completed').length
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            My Courses
          </h1>
          <p className="text-gray-600">View your enrolled courses and access class materials</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`w-full p-4 rounded-lg transition ${
              statusFilter === 'all'
                ? 'bg-blue-50'
                : 'bg-white hover:bg-blue-50'
            }`}
            >
              <div className="text-2xl font-bold text-gray-900">{stats.all}</div>
              <div className="text-sm text-gray-600">All Courses</div>
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 p-[1px] rounded-lg">
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`w-full p-4 rounded-lg transition ${
              statusFilter === 'upcoming'
                ? 'bg-orange-50'
                : 'bg-white hover:bg-orange-50'
            }`}
            >
              <div className="text-2xl font-bold text-orange-600">{stats.upcoming}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-green-200 via-emerald-200 to-green-200 p-[1px] rounded-lg">
            <button
              onClick={() => setStatusFilter('ongoing')}
              className={`w-full p-4 rounded-lg transition ${
              statusFilter === 'ongoing'
                ? 'bg-green-50'
                : 'bg-white hover:bg-green-50'
            }`}
            >
              <div className="text-2xl font-bold text-green-600">{stats.ongoing}</div>
              <div className="text-sm text-gray-600">Active</div>
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-gray-200 via-slate-200 to-gray-200 p-[1px] rounded-lg">
            <button
              onClick={() => setStatusFilter('completed')}
              className={`w-full p-4 rounded-lg transition ${
              statusFilter === 'completed'
                ? 'bg-gray-50'
                : 'bg-white hover:bg-gray-50'
            }`}
            >
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Courses Grid */}
        {filteredBatches.length === 0 ? (
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No courses found matching your filters'
                  : 'No courses enrolled yet'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Contact admin to enroll in a course'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link 
                  href="/courses"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                >
                  Browse Available Courses
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <div key={batch.id} className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl h-full">
                <Link
                  href={`/student/courses/${batch.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group block h-full flex flex-col"
                >
                {/* Course Image */}
                {batch.course_image ? (
                  <img
                    src={batch.course_image}
                    alt={batch.course_title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <svg className="w-16 h-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      batch.status === 'upcoming'
                        ? 'bg-orange-100 text-orange-700'
                        : batch.status === 'ongoing'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {batch.status}
                    </span>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Course Info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                    {batch.course_title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{batch.batch_name}</p>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Instructor: {batch.instructor_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(batch.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{batch.schedule}</span>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                    {batch.zoom_link && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">
                        Zoom
                      </span>
                    )}
                    {batch.telegram_group_id && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-semibold">
                        Telegram
                      </span>
                    )}
                  </div>
                </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
