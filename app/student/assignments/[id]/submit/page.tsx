'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  max_score: number
  batch_name: string
  course_title: string
}

export default function SubmitAssignment() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [submissionType, setSubmissionType] = useState<'code' | 'image'>('code')
  const [formData, setFormData] = useState({
    code_content: '',
    code_language: 'python',
    notes: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
    if (userProfile?.role === 'student' && assignmentId) {
      fetchAssignment()
    }
  }, [userProfile, assignmentId])

  async function fetchAssignment() {
    if (!userProfile?.id) return
    
    try {
      setLoading(true)
      
      // Fetch assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('id, title, description, due_date, max_score, batch_id')
        .eq('id', assignmentId)
        .single()

      if (assignmentError) throw assignmentError

      // Check if student is enrolled in this batch
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', userProfile.id)
        .eq('batch_id', assignmentData.batch_id)
        .single()

      if (enrollmentError || !enrollmentData) {
        setError('You are not enrolled in this batch')
        return
      }

      // Check if already submitted
      const { data: submissionData } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', userProfile.id)
        .single()

      if (submissionData) {
        setError('You have already submitted this assignment')
        setTimeout(() => {
          router.push(`/student/assignments/${assignmentId}/submission`)
        }, 2000)
        return
      }

      // Fetch batch and course info
      const { data: batchData } = await supabase
        .from('batches')
        .select('batch_name, course_id')
        .eq('id', assignmentData.batch_id)
        .single()

      let courseTitle = 'N/A'
      if (batchData?.course_id) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('title')
          .eq('id', batchData.course_id)
          .single()
        courseTitle = courseData?.title || 'N/A'
      }

      setAssignment({
        id: assignmentData.id,
        title: assignmentData.title,
        description: assignmentData.description,
        due_date: assignmentData.due_date,
        max_score: assignmentData.max_score,
        batch_name: batchData?.batch_name || 'N/A',
        course_title: courseTitle
      })

    } catch (err: any) {
      console.error('Fetch assignment error:', err)
      setError('Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are allowed')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (submissionType === 'code') {
      if (!formData.code_content.trim()) {
        setError('Please enter your code')
        return
      }
    } else {
      if (!imageFile) {
        setError('Please select an image to upload')
        return
      }
    }

    setSubmitting(true)

    try {
      let imageUrl = null

      // Upload image if submission type is image
      if (submissionType === 'image' && imageFile) {
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const fileName = `assignment-${assignmentId}-${userProfile?.id}-${timestamp}-${randomStr}.${imageFile.name.split('.').pop()}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('course-images')
          .upload(fileName, imageFile, {
            contentType: imageFile.type,
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('course-images')
          .getPublicUrl(fileName)

        imageUrl = urlData.publicUrl
      }

      // Create submission
      const submissionData: any = {
        assignment_id: assignmentId,
        student_id: userProfile?.id,
        submission_type: submissionType,
        notes: formData.notes || null,
        status: 'pending'
      }

      if (submissionType === 'code') {
        submissionData.code_content = formData.code_content
        submissionData.code_language = formData.code_language
      } else {
        submissionData.image_url = imageUrl
      }

      const { error: insertError } = await supabase
        .from('assignment_submissions')
        .insert(submissionData)

      if (insertError) throw insertError

      setSuccess('Assignment submitted successfully!')
      
      setTimeout(() => {
        router.push('/student/assignments')
      }, 1500)

    } catch (err: any) {
      console.error('Submit assignment error:', err)
      setError(err.message || 'Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
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

  if (!userProfile || userProfile.role !== 'student' || !assignment) {
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/student/assignments" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to Assignments
          </Link>
        </div>

        {/* Assignment Info */}
        <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-gray-600 mb-4">{assignment.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{assignment.course_title} - {assignment.batch_name}</span>
              <span>•</span>
              <span>Due: {formatDate(assignment.due_date)}</span>
              <span>•</span>
              <span>Max: {assignment.max_score} pts</span>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <div className="bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 p-[1px] rounded-xl">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Your Work</h2>

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
            {/* Submission Type Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Submission Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSubmissionType('code')}
                  className={`p-4 rounded-xl border-2 transition ${
                    submissionType === 'code'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💻</div>
                    <p className="font-semibold text-gray-900">Code Snippet</p>
                    <p className="text-xs text-gray-600 mt-1">Submit your code</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType('image')}
                  className={`p-4 rounded-xl border-2 transition ${
                    submissionType === 'image'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🖼️</div>
                    <p className="font-semibold text-gray-900">Image</p>
                    <p className="text-xs text-gray-600 mt-1">Upload screenshot</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Code Submission Fields */}
            {submissionType === 'code' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Programming Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="code_language"
                    value={formData.code_language}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Code <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="code_content"
                    value={formData.code_content}
                    onChange={handleChange}
                    required
                    rows={15}
                    placeholder="Paste your code here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500 mt-2">Paste your complete code solution</p>
                </div>
              </>
            )}

            {/* Image Submission Fields */}
            {submissionType === 'image' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Image <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-2">JPG, PNG, or WebP - Max 5MB</p>

                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Notes (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Any comments or explanations about your submission..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
              <Link
                href="/student/assignments"
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
