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
  id: string
  student_name: string
  student_email: string
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

export default function AssignmentSubmissions() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [gradeForm, setGradeForm] = useState({
    score: '',
    feedback: ''
  })
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

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
    if (userProfile?.role === 'instructor' && assignmentId) {
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
        .select('id, title, description, due_date, max_score, batch_id, instructor_id')
        .eq('id', assignmentId)
        .single()

      if (assignmentError) throw assignmentError

      // Verify instructor owns this assignment
      if (assignmentData.instructor_id !== userProfile.id) {
        setError('You do not have permission to view this assignment')
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

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false })

      if (submissionsError) throw submissionsError

      const formatted = await Promise.all(
        (submissionsData || []).map(async (s: any) => {
          const { data: studentData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', s.student_id)
            .single()

          return {
            id: s.id,
            student_name: studentData?.name || 'Unknown',
            student_email: studentData?.email || 'N/A',
            submission_type: s.submission_type,
            code_content: s.code_content,
            code_language: s.code_language,
            image_url: s.image_url,
            notes: s.notes,
            submitted_at: s.submitted_at,
            score: s.score,
            feedback: s.feedback,
            status: s.status
          }
        })
      )

      setSubmissions(formatted)

    } catch (err: any) {
      console.error('Fetch error:', err)
      setError('Failed to load assignment data')
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmission = (submissionId: string, currentScore: number | null) => {
    setSelectedSubmission(submissionId)
    setGradeForm({
      score: currentScore !== null ? currentScore.toString() : '',
      feedback: submissions.find(s => s.id === submissionId)?.feedback || ''
    })
    setError('')
    setSuccess('')
  }

  const submitGrade = async (submissionId: string) => {
    setError('')
    setSuccess('')

    const score = parseInt(gradeForm.score)
    if (isNaN(score) || score < 0 || score > assignment!.max_score) {
      setError(`Score must be between 0 and ${assignment!.max_score}`)
      return
    }

    setGrading(submissionId)

    try {
      const { error: updateError } = await supabase
        .from('assignment_submissions')
        .update({
          score: score,
          feedback: gradeForm.feedback || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: userProfile?.id
        })
        .eq('id', submissionId)

      if (updateError) throw updateError

      setSuccess('Grade submitted successfully!')
      setSelectedSubmission(null)
      
      // Refresh data
      await fetchData()

    } catch (err: any) {
      console.error('Grade submission error:', err)
      setError(err.message || 'Failed to submit grade')
    } finally {
      setGrading(null)
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

  if (!userProfile || userProfile.role !== 'instructor' || !assignment) {
    return null
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    avgScore: submissions.filter(s => s.score !== null).length > 0
      ? Math.round(submissions.filter(s => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score !== null).length)
      : 0
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
          <Link href="/instructor/assignments" className="text-purple-600 hover:text-purple-700 text-sm font-semibold">
            ← Back to Assignments
          </Link>
        </div>

        {/* Assignment Info */}
        <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl mb-6">
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">Graded</p>
              <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 p-[1px] rounded-xl">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgScore}/{assignment.max_score}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
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

        {/* Submissions List */}
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <p className="text-lg font-semibold text-gray-900 mb-2">No submissions yet</p>
                <p className="text-sm text-gray-600">Students haven't submitted their work yet</p>
              </div>
            </div>
          ) : (
            submissions.map((submission) => (
              <div key={submission.id} className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 p-[1px] rounded-xl">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{submission.student_name}</h3>
                      <p className="text-sm text-gray-600">{submission.student_email}</p>
                      <p className="text-sm text-gray-500 mt-1">Submitted: {formatDate(submission.submitted_at)}</p>
                    </div>
                    <div className="text-right">
                      {submission.status === 'graded' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                          ✓ Graded: {submission.score}/{assignment.max_score}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Content */}
                  <div className="mb-4">
                    {submission.submission_type === 'code' ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Code ({submission.code_language}):</p>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{submission.code_content}</code>
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Image Submission:</p>
                        <img 
                          src={submission.image_url || ''} 
                          alt="Submission" 
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    {submission.notes && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Student Notes:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{submission.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Grading Section */}
                  {selectedSubmission === submission.id ? (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Grade This Submission</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Score (0-{assignment.max_score}) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={assignment.max_score}
                            value={gradeForm.score}
                            onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback (Optional)</label>
                          <textarea
                            rows={3}
                            value={gradeForm.feedback}
                            onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                            placeholder="Provide feedback for the student..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitGrade(submission.id)}
                          disabled={grading === submission.id}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                        >
                          {grading === submission.id ? 'Saving...' : 'Submit Grade'}
                        </button>
                        <button
                          onClick={() => setSelectedSubmission(null)}
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-4">
                      {submission.status === 'graded' && submission.feedback && (
                        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Your Feedback:</p>
                          <p className="text-sm text-blue-700">{submission.feedback}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleGradeSubmission(submission.id, submission.score)}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                      >
                        {submission.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
