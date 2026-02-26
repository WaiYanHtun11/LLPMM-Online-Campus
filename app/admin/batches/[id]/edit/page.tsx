'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminNavbar from '@/components/AdminNavbar'

interface Course {
  id: string
  title: string
}

interface Instructor {
  id: string
  name: string
  payment_model?: string | null
}

export default function EditBatch({ params }: { params: Promise<{ id: string }> }) {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [batchId, setBatchId] = useState<string>('')
  
  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [enrollmentCount, setEnrollmentCount] = useState(0)

  const [formData, setFormData] = useState({
    course_id: '',
    batch_name: '',
    start_date: '',
    end_date: '',
    instructor_id: '',
    instructor_salary: '',
    max_students: '30',
    status: 'upcoming',
    schedule: '',
    zoom_link: '',
    zoom_password: '',
    telegram_group_id: ''
  })

  useEffect(() => {
    params.then(p => setBatchId(p.id))
  }, [params])

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
    if (userProfile?.role === 'admin' && batchId) {
      fetchData()
    }
  }, [userProfile, batchId])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Fetch batch data
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single()

      if (batchError) throw batchError

      if (batchData) {
        setFormData({
          course_id: batchData.course_id || '',
          batch_name: batchData.batch_name || '',
          start_date: batchData.start_date || '',
          end_date: batchData.end_date || '',
          instructor_id: batchData.instructor_id || '',
          instructor_salary: batchData.instructor_salary?.toString() || '',
          max_students: batchData.max_students?.toString() || '30',
          status: batchData.status || 'upcoming',
          schedule: batchData.schedule || '',
          zoom_link: batchData.zoom_link || '',
          zoom_password: batchData.zoom_password || '',
          telegram_group_id: batchData.telegram_group_id || ''
        })
      }

      // Fetch enrollment count
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId)

      setEnrollmentCount(count || 0)

      // Fetch active courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title')

      if (coursesError) throw coursesError
      setCourses(coursesData || [])

      // Fetch instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('users')
        .select('id, name, payment_model')
        .eq('role', 'instructor')
        .order('name')

      if (instructorsError) throw instructorsError
      setInstructors(instructorsData || [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Validate required fields
      if (!formData.course_id || !formData.batch_name || !formData.start_date || 
          !formData.instructor_id || !formData.schedule) {
        throw new Error('Please fill in all required fields')
      }

      if (parseInt(formData.max_students) < 1) {
        throw new Error('Max students must be at least 1')
      }

      // Check if reducing max_students below current enrollment count
      if (parseInt(formData.max_students) < enrollmentCount) {
        throw new Error(`Cannot set max students to ${formData.max_students}. There are already ${enrollmentCount} enrolled students.`)
      }

      // Update database
      const selectedInstructor = instructors.find(i => i.id === formData.instructor_id)
      const isFixedSalary = selectedInstructor?.payment_model === 'fixed_salary'
      const parsedSalary = Number.parseInt(formData.instructor_salary, 10)

      const { error: dbError } = await supabase
        .from('batches')
        .update({
          course_id: formData.course_id,
          batch_name: formData.batch_name,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          instructor_id: formData.instructor_id,
          instructor_salary: isFixedSalary && Number.isFinite(parsedSalary) ? parsedSalary : null,
          max_students: parseInt(formData.max_students),
          status: formData.status,
          schedule: formData.schedule,
          zoom_link: formData.zoom_link || null,
          zoom_password: formData.zoom_password || null,
          telegram_group_id: formData.telegram_group_id || null
        })
        .eq('id', batchId)

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error(dbError.message)
      }

      alert('Batch updated successfully!')
      router.push('/admin/batches')

    } catch (err: any) {
      setError(err.message || 'Failed to update batch')
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

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

  const selectedInstructor = instructors.find(i => i.id === formData.instructor_id)
  const isFixedSalary = selectedInstructor?.payment_model === 'fixed_salary'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <AdminNavbar
        title="Edit Batch"
        subtitle="Update batch details and settings"
        userName={userProfile.name}
        userEmail={userProfile.email}
        onLogout={handleLogout}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/admin/batches" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to Batches
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Enrollment Info */}
        {enrollmentCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            <strong>Note:</strong> This batch has {enrollmentCount} enrolled student(s). 
            You cannot reduce max students below this number.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
            Edit Batch
          </h1>

          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Course Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              {/* Batch Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Batch Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.batch_name}
                  onChange={(e) => setFormData({...formData, batch_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Python - B29"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">A unique identifier for this batch</p>
              </div>

              {/* Instructor */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Instructor <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.instructor_id}
                  onChange={(e) => setFormData({...formData, instructor_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                  ))}
                </select>
              </div>

              {isFixedSalary && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Instructor Salary (MMK)
                  </label>
                  <input
                    type="number"
                    value={formData.instructor_salary}
                    onChange={(e) => setFormData({...formData, instructor_salary: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500000"
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed salary for this batch.</p>
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Max Students */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Students <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min={enrollmentCount}
                  value={formData.max_students}
                  onChange={(e) => setFormData({...formData, max_students: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {enrollmentCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Minimum: {enrollmentCount} (current enrollments)</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Schedule */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Schedule <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Mon, Wed, Fri - 7:00 PM"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Class days and time</p>
              </div>

              {/* Current Enrollments (Read-only) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Enrollments
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {enrollmentCount} student(s) enrolled
                </div>
              </div>
            </div>
          </div>

          {/* Online Class Details */}
          <div className="mb-8 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Online Class Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zoom Link */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zoom Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.zoom_link}
                  onChange={(e) => setFormData({...formData, zoom_link: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              {/* Zoom Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zoom Password (Optional)
                </label>
                <input
                  type="text"
                  value={formData.zoom_password}
                  onChange={(e) => setFormData({...formData, zoom_password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Meeting password"
                />
              </div>

              {/* Telegram Group ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telegram Group ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.telegram_group_id}
                  onChange={(e) => setFormData({...formData, telegram_group_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-1003467604172"
                />
                <p className="text-xs text-gray-500 mt-1">Telegram group chat ID for this batch</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/batches"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
