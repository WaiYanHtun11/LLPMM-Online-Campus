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
  max_students: number
}

interface Student {
  id: string
  name: string
  email: string
}

interface Enrollment {
  id: string
  student_id: string
  enrolled_date: string
  status: string
  student_name: string
  student_email: string
  payment_status?: string
  payment_amount?: number
  paid_amount?: number
}

export default function BatchEnrollments({ params }: { params: Promise<{ id: string }> }) {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [batchId, setBatchId] = useState<string>('')
  
  const [batch, setBatch] = useState<Batch | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'installment_2'>('installment_2')
  const [initialPayment, setInitialPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('KPay')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentNotes, setPaymentNotes] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [unenrolling, setUnenrolling] = useState<string | null>(null)

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
      
      // Fetch batch info
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select(`
          id,
          batch_name,
          max_students,
          courses!inner(title)
        `)
        .eq('id', batchId)
        .single()

      if (batchError) throw batchError

      setBatch({
        id: batchData.id,
        batch_name: batchData.batch_name,
        course_title: batchData.courses.title,
        max_students: batchData.max_students
      })

      // Fetch enrollments with student info and payment data
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          enrolled_date,
          status,
          users!inner(name, email),
          payments!left(total_amount, paid_amount, status)
        `)
        .eq('batch_id', batchId)
        .order('enrolled_date', { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      const formattedEnrollments = (enrollmentsData || []).map((e: any) => {
        // Handle both array (Supabase default) and object (some cases) formats
        const payment = Array.isArray(e.payments) ? e.payments[0] : e.payments
        
        return {
          id: e.id,
          student_id: e.student_id,
          enrolled_date: e.enrolled_date,
          status: e.status,
          student_name: e.users.name,
          student_email: e.users.email,
          payment_status: payment?.status || 'no record',
          payment_amount: payment?.total_amount || 0,
          paid_amount: payment?.paid_amount || 0
        }
      })

      setEnrollments(formattedEnrollments)

      // Fetch available students (not enrolled in this batch)
      const enrolledStudentIds = formattedEnrollments.map(e => e.student_id)
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'student')
        .order('name')

      if (studentsError) throw studentsError

      const available = (studentsData || []).filter(
        (s: Student) => !enrolledStudentIds.includes(s.id)
      )
      setAvailableStudents(available)

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

  const handleEnroll = async () => {
    if (!selectedStudent) {
      alert('Please select a student')
      return
    }

    // Check if batch is full
    if (enrollments.length >= (batch?.max_students || 0)) {
      alert('This batch is full! Cannot enroll more students.')
      return
    }

    try {
      setEnrolling(true)
      setError('')

      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          student_id: selectedStudent,
          payment_plan: paymentPlan,
          initial_payment: initialPayment,
          payment_method: initialPayment ? paymentMethod : null,
          payment_date: initialPayment ? paymentDate : null,
          payment_notes: initialPayment ? paymentNotes : null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to enroll student')
      }

      alert('Student enrolled successfully!')
      setShowAddModal(false)
      setSelectedStudent('')
      setStudentSearchQuery('')
      setPaymentPlan('installment_2')
      setInitialPayment(false)
      setPaymentMethod('KPay')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setPaymentNotes('')
      fetchData() // Refresh data

    } catch (err: any) {
      setError(err.message || 'Failed to enroll student')
      alert(`Error: ${err.message}`)
    } finally {
      setEnrolling(false)
    }
  }

  const handleUnenroll = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from this batch?\n\nThis will also remove their payment records.`)) {
      return
    }

    try {
      setUnenrolling(enrollmentId)
      setError('')

      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unenroll student')
      }

      alert('Student unenrolled successfully!')
      fetchData() // Refresh data

    } catch (err: any) {
      setError(err.message || 'Failed to unenroll student')
      alert(`Error: ${err.message}`)
    } finally {
      setUnenrolling(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'admin' || !batch) {
    return null
  }

  const isFull = enrollments.length >= batch.max_students

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
              LLPMM Campus
            </Link>
            <p className="text-sm text-gray-600 mt-1">Batch Enrollments</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Admin: {userProfile.name}</span>
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
          <Link href="/admin/batches" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to Batches
          </Link>
        </div>

        {/* Batch Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {batch.batch_name}
              </h1>
              <p className="text-gray-600">Course: {batch.course_title}</p>
              <p className={`text-sm font-semibold mt-2 ${
                isFull ? 'text-red-600' : 'text-blue-600'
              }`}>
                {enrollments.length} / {batch.max_students} students enrolled
                {isFull && ' (FULL)'}
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddModal(true)
                setStudentSearchQuery('')
                setSelectedStudent('')
                setPaymentPlan('installment_2')
                setInitialPayment(false)
                setPaymentMethod('KPay')
                setPaymentDate(new Date().toISOString().split('T')[0])
                setPaymentNotes('')
              }}
              disabled={isFull}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Student
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Enrollments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Enrolled Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No students enrolled yet. Click "Add Student" to enroll the first student.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {enrollment.student_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {enrollment.student_email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(enrollment.enrolled_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          enrollment.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : enrollment.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-gray-900">
                          {enrollment.paid_amount?.toLocaleString() || 0} / {enrollment.payment_amount?.toLocaleString() || 0} MMK
                        </div>
                        <div className={`text-xs ${
                          enrollment.payment_status === 'paid'
                            ? 'text-green-600'
                            : enrollment.payment_status === 'partial'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {enrollment.payment_status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/enrollments/${enrollment.id}/payment`}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-semibold"
                          >
                            Payment
                          </Link>
                          <button
                            onClick={() => handleUnenroll(enrollment.id, enrollment.student_name)}
                            disabled={unenrolling === enrollment.id}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {unenrolling === enrollment.id ? 'Removing...' : 'Remove'}
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Add Student to Batch
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Select a student to enroll in {batch.batch_name}
            </p>

            {availableStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No available students. All students are either already enrolled or no students exist.
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {/* Search Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search Students
                  </label>
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Student Select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-48 overflow-y-auto"
                    size={Math.min(
                      availableStudents.filter(s => 
                        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                        s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                      ).length + 1,
                      8
                    )}
                  >
                    <option value="">Select a student</option>
                    {availableStudents
                      .filter(student => 
                        student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                        student.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                      )
                      .map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </option>
                      ))
                    }
                  </select>
                  {studentSearchQuery && availableStudents.filter(s => 
                    s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <p className="text-xs text-red-600 mt-1">No students found matching "{studentSearchQuery}"</p>
                  )}
                </div>

                {/* Payment Options */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Payment Options</h4>
                  
                  {/* Payment Plan */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Plan <span className="text-red-600">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="installment_2"
                          checked={paymentPlan === 'installment_2'}
                          onChange={(e) => setPaymentPlan(e.target.value as 'installment_2')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">2 Installments (50% now, 50% after 4 weeks)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="full"
                          checked={paymentPlan === 'full'}
                          onChange={(e) => setPaymentPlan(e.target.value as 'full')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Full Payment (Pay all now)</span>
                      </label>
                    </div>
                  </div>

                  {/* Initial Payment Checkbox */}
                  <div className="mb-4">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={initialPayment}
                        onChange={(e) => setInitialPayment(e.target.checked)}
                        className="mt-1 mr-2"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-700">
                          {paymentPlan === 'full' ? 'Mark as paid in full' : 'Record initial payment (1st installment)'}
                        </span>
                        <p className="text-xs text-gray-500">Check this if student has already paid</p>
                      </div>
                    </label>
                  </div>

                  {/* Payment Details (shown only if initialPayment is checked) */}
                  {initialPayment && (
                    <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Payment Date <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Payment Method <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        >
                          <option value="KPay">KPay</option>
                          <option value="WavePay">WavePay</option>
                          <option value="CB Pay">CB Pay</option>
                          <option value="AYA Pay">AYA Pay</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={2}
                          placeholder="Transaction ID, reference number, etc."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleEnroll}
                disabled={enrolling || !selectedStudent || availableStudents.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrolling ? 'Enrolling...' : 'Enroll Student'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedStudent('')
                  setStudentSearchQuery('')
                  setPaymentPlan('installment_2')
                  setInitialPayment(false)
                  setPaymentMethod('KPay')
                  setPaymentDate(new Date().toISOString().split('T')[0])
                  setPaymentNotes('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
