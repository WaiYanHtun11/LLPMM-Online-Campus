'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminNavbar from '@/components/AdminNavbar'

interface Batch {
  id: string
  batch_name: string
  start_date: string
  end_date: string | null
  max_students: number
  instructor_salary: number | null
  status: 'upcoming' | 'ongoing' | 'completed'
  schedule: string
  course_id: string
  instructor_id: string
  created_at: string
}

interface BatchWithDetails extends Batch {
  course_title: string
  instructor_name: string
  enrollment_count: number
}

export default function BatchesManagement() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [batches, setBatches] = useState<BatchWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'admin') {
        router.push(`/${userProfile.role}`)
      }
    }
  }, [user, userProfile, authLoading, router])

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchBatches()
    }
  }, [userProfile])

  async function fetchBatches() {
    try {
      setLoading(true)
      
      // Fetch batches with course and instructor info
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select(`
          *,
          courses!inner(title),
          users!inner(name)
        `)
        .order('start_date', { ascending: false })

      if (batchesError) throw batchesError

      // Fetch enrollment counts for each batch
      const batchesWithDetails = await Promise.all(
        (batchesData || []).map(async (batch: any) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id)

          return {
            id: batch.id,
            batch_name: batch.batch_name,
            start_date: batch.start_date,
            end_date: batch.end_date,
            max_students: batch.max_students,
            instructor_salary: batch.instructor_salary ?? null,
            status: batch.status,
            schedule: batch.schedule,
            course_id: batch.course_id,
            instructor_id: batch.instructor_id,
            created_at: batch.created_at,
            course_title: batch.courses.title,
            instructor_name: batch.users.name,
            enrollment_count: count || 0
          }
        })
      )

      setBatches(batchesWithDetails)
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

  const handleDelete = async (batchId: string, batchName: string, enrollmentCount: number) => {
    if (enrollmentCount > 0) {
      alert(`Cannot delete "${batchName}" because it has ${enrollmentCount} enrolled student(s).\n\nPlease remove all enrollments first.`)
      return
    }

    if (!confirm(`Delete batch "${batchName}"? This cannot be undone.`)) {
      return
    }

    try {
      setDeleting(batchId)
      setError('')

      const response = await fetch(`/api/admin/batches/${batchId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete batch')
      }

      // Remove batch from local state
      setBatches(batches.filter(b => b.id !== batchId))
      
      alert('Batch deleted successfully!')

    } catch (err: any) {
      setError(err.message || 'Failed to delete batch')
      alert(`Error: ${err.message}`)
    } finally {
      setDeleting(batchId)
    }
  }

  // Filter batches
  const filteredBatches = batches.filter((batch) => {
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter
    const matchesSearch = 
      batch.batch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.instructor_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // Count batches by status
  const upcomingCount = batches.filter(b => b.status === 'upcoming').length
  const ongoingCount = batches.filter(b => b.status === 'ongoing').length
  const completedCount = batches.filter(b => b.status === 'completed').length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <AdminNavbar
        title="Batch Management"
        subtitle="Manage all batches and enrollments"
        userName={userProfile.name}
        userEmail={userProfile.email}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 transition text-sm font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-blue-600">{batches.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Batches</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600">{upcomingCount}</div>
              <div className="text-sm text-gray-600 mt-1">Upcoming</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-purple-600">{ongoingCount}</div>
              <div className="text-sm text-gray-600 mt-1">Ongoing</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-gray-600">{completedCount}</div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search batches, courses, or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>

            {/* Create Batch Button */}
            <Link
              href="/admin/batches/create"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition whitespace-nowrap"
            >
              + Create Batch
            </Link>
            </div>
          </div>
        </div>

        {/* Batches Table */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Batch Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Instructor Salary
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'No batches found matching your filters.'
                        : 'No batches yet. Create your first batch!'}
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{batch.batch_name}</div>
                        <div className="text-sm text-gray-500">{batch.schedule}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {batch.course_title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {batch.instructor_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {batch.instructor_salary == null
                          ? '-'
                          : `${batch.instructor_salary.toLocaleString()} MMK`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(batch.start_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-semibold ${
                          batch.enrollment_count >= batch.max_students ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {batch.enrollment_count} / {batch.max_students}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          batch.status === 'upcoming'
                            ? 'bg-green-100 text-green-700'
                            : batch.status === 'ongoing'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/batches/${batch.id}/enrollments`}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-semibold"
                          >
                            Enrollments
                          </Link>
                          <Link
                            href={`/admin/batches/${batch.id}/edit`}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(batch.id, batch.batch_name, batch.enrollment_count)}
                            disabled={deleting === batch.id}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === batch.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
