'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Batch {
  id: string
  batch_name: string
  course_title: string
}

export default function CreateAssignment() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    batch_id: '',
    title: '',
    description: '',
    due_date: '',
    max_score: '100'
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
      fetchBatches()
    }
  }, [userProfile])

  async function fetchBatches() {
    if (!userProfile?.id) return
    
    try {
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('id, batch_name, course_id')
        .eq('instructor_id', userProfile.id)
        .order('start_date', { ascending: false })

      if (batchesError) throw batchesError

      const formatted = await Promise.all(
        (batchesData || []).map(async (b: any) => {
          const { data: courseData } = await supabase
            .from('courses')
            .select('title')
            .eq('id', b.course_id)
            .single()

          return {
            id: b.id,
            batch_name: b.batch_name,
            course_title: courseData?.title || 'N/A'
          }
        })
      )

      setBatches(formatted)
    } catch (err: any) {
      console.error('Fetch batches error:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.batch_id || !formData.title || !formData.description || !formData.due_date) {
      setError('Please fill in all required fields')
      return
    }

    if (parseInt(formData.max_score) < 1) {
      setError('Max score must be at least 1')
      return
    }

    setLoading(true)

    try {
      const { data, error: insertError } = await supabase
        .from('assignments')
        .insert({
          batch_id: formData.batch_id,
          title: formData.title,
          description: formData.description,
          due_date: new Date(formData.due_date).toISOString(),
          max_score: parseInt(formData.max_score),
          instructor_id: userProfile?.id,
          is_active: true
        })
        .select()
        .single()

      if (insertError) throw insertError

      setSuccess('Assignment created successfully!')
      
      setTimeout(() => {
        router.push('/instructor/assignments')
      }, 1500)

    } catch (err: any) {
      console.error('Create assignment error:', err)
      setError(err.message || 'Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading) {
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/instructor/assignments" className="text-purple-600 hover:text-purple-700 text-sm font-semibold">
            ← Back to Assignments
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Create New Assignment
          </h1>
          <p className="text-gray-600">Create an assignment for your students</p>
        </div>

        {/* Form */}
        <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
          <div className="bg-white rounded-xl shadow-sm p-8">
            {error && (
              <div className="mb-6 bg-gradient-to-r from-red-200 via-pink-200 to-red-200 p-[1px] rounded-lg">
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-lg">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Batch <span className="text-red-500">*</span>
              </label>
              <select
                name="batch_id"
                value={formData.batch_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Select a batch --</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.course_title} - {batch.batch_name}
                  </option>
                ))}
              </select>
              {batches.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No batches found. Create a batch first.</p>
              )}
            </div>

            {/* Assignment Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assignment Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Python Functions Exercise"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Describe what students need to do. Students can submit code snippets or images."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Students can submit either code snippets or images for this assignment
              </p>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Max Score */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="max_score"
                value={formData.max_score}
                onChange={handleChange}
                required
                min="1"
                max="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">Points this assignment is worth (default: 100)</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || batches.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Assignment'}
              </button>
              <Link
                href="/instructor/assignments"
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}
