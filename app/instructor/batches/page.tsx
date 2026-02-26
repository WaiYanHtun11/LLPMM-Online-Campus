'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import InstructorNavbar from '@/components/InstructorNavbar'

interface Batch {
  id: string
  batch_name: string
  course_title: string
  start_date: string
  end_date: string | null
  status: string
  schedule: string
  max_students: number
  enrollment_count: number
  zoom_link: string | null
  telegram_group_id: string | null
}

export default function InstructorBatches() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

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
    }
  }, [userProfile])

  async function fetchBatches() {
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
          end_date,
          status,
          schedule,
          max_students,
          zoom_link,
          telegram_group_id,
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
            end_date: batch.end_date,
            status: batch.status,
            schedule: batch.schedule,
            max_students: batch.max_students,
            enrollment_count: count || 0,
            zoom_link: batch.zoom_link,
            telegram_group_id: batch.telegram_group_id
          }
        })
      )

      setBatches(batchesWithCounts)
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
  const filteredBatches = batches.filter(batch => {
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter
    const matchesSearch = batch.batch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         batch.course_title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Calculate stats
  const stats = {
    all: batches.length,
    upcoming: batches.filter(b => b.status === 'upcoming').length,
    ongoing: batches.filter(b => b.status === 'ongoing').length,
    completed: batches.filter(b => b.status === 'completed').length
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

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-200 via-pink-200 to-red-200 p-[1px] rounded-lg mb-6">
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            My Batches
          </h1>
          <p className="text-gray-600">View and manage your assigned batches</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`w-full p-4 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-purple-50'
                  : 'bg-white hover:bg-purple-50/60'
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{stats.all}</div>
              <div className="text-sm text-gray-600">All Batches</div>
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-lg">
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`w-full p-4 rounded-lg transition ${
                statusFilter === 'upcoming'
                  ? 'bg-green-50'
                  : 'bg-white hover:bg-green-50/70'
              }`}
            >
              <div className="text-2xl font-bold text-green-600">{stats.upcoming}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-lg">
            <button
              onClick={() => setStatusFilter('ongoing')}
              className={`w-full p-4 rounded-lg transition ${
                statusFilter === 'ongoing'
                  ? 'bg-purple-50'
                  : 'bg-white hover:bg-purple-50/60'
              }`}
            >
              <div className="text-2xl font-bold text-purple-600">{stats.ongoing}</div>
              <div className="text-sm text-gray-600">Ongoing</div>
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-slate-200 via-gray-200 to-slate-200 p-[1px] rounded-lg">
            <button
              onClick={() => setStatusFilter('completed')}
              className={`w-full p-4 rounded-lg transition ${
                statusFilter === 'completed'
                  ? 'bg-gray-50'
                  : 'bg-white hover:bg-gray-50/80'
              }`}
            >
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batches..."
              className="w-full px-4 py-2 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Batches Grid */}
        {filteredBatches.length === 0 ? (
          <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No batches found matching your filters'
                  : 'No batches assigned yet'}
              </p>
              <p className="text-sm text-gray-600">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Contact admin to get assigned to a batch'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <div key={batch.id} className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
                <Link
                  href={`/instructor/batches/${batch.id}`}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition group block"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      batch.status === 'upcoming'
                        ? 'bg-green-100 text-green-700'
                        : batch.status === 'ongoing'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {batch.status}
                    </span>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Batch Info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition">
                    {batch.batch_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{batch.course_title}</p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
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

                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className={`font-semibold ${
                        batch.enrollment_count >= batch.max_students ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {batch.enrollment_count} / {batch.max_students} students
                      </span>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {batch.zoom_link && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">
                        Zoom
                      </span>
                    )}
                    {batch.telegram_group_id && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-semibold">
                        Telegram
                      </span>
                    )}
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
