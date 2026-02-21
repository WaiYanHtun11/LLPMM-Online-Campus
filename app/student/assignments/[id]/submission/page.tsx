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

interface Submission {
  submission_type: string
  code_content: string | null
  code_language: string | null
  image_url: string | null
  notes: string | null
  submitted_at: string
  score: number | null
  feedback: string | null
  status: string
}

export default function ViewSubmission() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      fetchData()
    }
  }, [userProfile, assignmentId])

  async function fetchData() {
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

      // Fetch student's submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', userProfile.id)
        .single()

      if (submissionError) {
        if (submissionError.code === 'PGRST116') {
          // No submission found
          setError('You have not submitted this assignment yet')
          setTimeout(() => {
            router.push(`/student/assignments/${assignmentId}/submit`)
          }, 2000)
        } else {
          throw submissionError
        }
        return
      }

      setSubmission({
        submission_type: submissionData.submission_type,
        code_content: submissionData.code_content,
        code_language: submissionData.code_language,
        image_url: submissionData.image_url,
        notes: submissionData.notes,
        submitted_at: submissionData.submitted_at,
        score: submissionData.score,
        feedback: submissionData.feedback,
        status: submissionData.status
      })

    } catch (err: any) {
      console.error('Fetch error:', err)
      setError('Failed to load submission data')
    } finally {
      setLoading(false)
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

  if (!userProfile || userProfile.role !== 'student' || !assignment || !submission) {
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

        {/* Status Card */}
        <div className={`p-[1px] rounded-xl shadow-sm mb-6 ${submission.status === 'graded' ? 'bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200' : 'bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200'}`}>
          <div className={`rounded-xl p-6 ${submission.status === 'graded' ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {submission.status === 'graded' ? '✓ Assignment Graded' : '⏳ Pending Review'}
                </h3>
                <p className="text-sm text-gray-600">
                  Submitted on {formatDate(submission.submitted_at)}
                </p>
              </div>
              {submission.status === 'graded' && submission.score !== null && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Your Score</p>
                  <p className="text-3xl font-bold text-green-600">
                    {submission.score}/{assignment.max_score}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.round((submission.score / assignment.max_score) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {submission.status === 'graded' && submission.feedback && (
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl mb-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3">📝 Instructor Feedback</h3>
              <p className="text-blue-700">{submission.feedback}</p>
            </div>
          </div>
        )}

        {/* Your Submission */}
        <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Submission</h2>

            {submission.submission_type === 'code' ? (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Code Submission ({submission.code_language})
                  </p>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    💻 Code
                  </span>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{submission.code_content}</code>
                </pre>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">Image Submission</p>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    🖼️ Image
                  </span>
                </div>
                <img 
                  src={submission.image_url || ''} 
                  alt="Your submission" 
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
              </div>
            )}

            {submission.notes && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Your Notes:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{submission.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/student/assignments"
            className="flex-1 text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Back to Assignments
          </Link>
        </div>
      </div>
    </div>
  )
}
