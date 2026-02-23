'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface EnrollmentData {
  id: string
  student_name: string
  student_email: string
  batch_name: string
  course_title: string
  enrolled_date: string
  status: string
  batch_id: string
  batch_start_date: string
  certificate: boolean
  certificate_url: string | null
  certificate_source: 'uploaded' | 'generated' | null
  certificate_issued_at: string | null
}

interface CertificateMetrics {
  attendance_rate: number
  assignment_rate: number
  is_eligible: boolean
  batch_ended: boolean
}

interface PaymentData {
  id: string
  base_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  plan_type: string
  status: string
  multi_course_discount: boolean
  discount_notes: string | null
  notes: string | null
}

interface Installment {
  id: string
  number: number
  amount: number
  due_type: string
  due_date: string
  paid_date: string | null
  status: string
  payment_method: string | null
  notes: string | null
}

export default function EnrollmentPayment({ params }: { params: Promise<{ id: string }> }) {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [enrollmentId, setEnrollmentId] = useState<string>('')
  
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [certificateMetrics, setCertificateMetrics] = useState<CertificateMetrics | null>(null)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [uploadingCertificate, setUploadingCertificate] = useState(false)
  
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'KPay',
    notes: ''
  })
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    params.then(p => setEnrollmentId(p.id))
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
    if (userProfile?.role === 'admin' && enrollmentId) {
      fetchData()
    }
  }, [userProfile, enrollmentId])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Fetch enrollment with student and batch info
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrolled_date,
          status,
          batch_id,
          certificate,
          certificate_url,
          certificate_source,
          certificate_issued_at,
          users!inner(name, email),
          batches!inner(
            batch_name,
            start_date,
            courses!inner(title)
          )
        `)
        .eq('id', enrollmentId)
        .single()

      if (enrollmentError) throw enrollmentError

      const student = Array.isArray(enrollmentData.users)
        ? enrollmentData.users[0]
        : enrollmentData.users
      const batchData = Array.isArray(enrollmentData.batches)
        ? enrollmentData.batches[0]
        : enrollmentData.batches
      const course = Array.isArray(batchData?.courses)
        ? batchData.courses[0]
        : batchData?.courses

      setEnrollment({
        id: enrollmentData.id,
        student_name: student?.name || '',
        student_email: student?.email || '',
        batch_name: batchData?.batch_name || '',
        course_title: course?.title || '',
        enrolled_date: enrollmentData.enrolled_date,
        status: enrollmentData.status,
        batch_id: enrollmentData.batch_id,
        batch_start_date: batchData?.start_date || '',
        certificate: enrollmentData.certificate || false,
        certificate_url: enrollmentData.certificate_url || null,
        certificate_source: enrollmentData.certificate_source || null,
        certificate_issued_at: enrollmentData.certificate_issued_at || null,
      })

      // Fetch payment info
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .single()

      if (paymentError) throw paymentError
      setPayment(paymentData)

      // Fetch installments
      const { data: installmentsData, error: installmentsError } = await supabase
        .from('payment_installments')
        .select('*')
        .eq('payment_id', paymentData.id)
        .order('number')

      if (installmentsError) throw installmentsError
      setInstallments(installmentsData || [])

      const { data: metricsData } = await supabase
        .rpc('calculate_enrollment_performance', { p_enrollment_id: enrollmentId })

      if (metricsData && metricsData[0]) {
        setCertificateMetrics(metricsData[0] as CertificateMetrics)
      }

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

  const handleCertificateUpload = async () => {
    if (!enrollmentId || !certificateFile) {
      setError('Please choose a certificate file first')
      return
    }

    try {
      setUploadingCertificate(true)
      setError('')

      const formData = new FormData()
      formData.append('file', certificateFile)
      formData.append('enrollmentId', enrollmentId)

      const response = await fetch('/api/admin/certificates/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload certificate')
      }

      setCertificateFile(null)
      await fetchData()
      alert('Certificate uploaded successfully!')
    } catch (uploadError: any) {
      setError(uploadError.message || 'Certificate upload failed')
    } finally {
      setUploadingCertificate(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedInstallment || !payment) return

    try {
      setRecording(true)
      setError('')

      const response = await fetch('/api/admin/payments/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installment_id: selectedInstallment.id,
          payment_id: payment.id,
          paid_date: paymentForm.paid_date,
          payment_method: paymentForm.payment_method,
          notes: paymentForm.notes
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record payment')
      }

      alert('Payment recorded successfully!')
      setShowPayModal(false)
      setSelectedInstallment(null)
      setPaymentForm({
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: 'KPay',
        notes: ''
      })
      fetchData() // Refresh data

    } catch (err: any) {
      setError(err.message || 'Failed to record payment')
      alert(`Error: ${err.message}`)
    } finally {
      setRecording(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'admin' || !enrollment || !payment) {
    return null
  }

  const remaining = payment.total_amount - payment.paid_amount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
              LLPMM Campus
            </Link>
            <p className="text-sm text-gray-600 mt-1">Payment Management</p>
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
          <Link 
            href={`/admin/batches/${enrollment.batch_id}/enrollments`} 
            className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
          >
            ← Back to Enrollments
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Student & Batch Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Payment Details
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Student:</span>
              <span className="ml-2 text-gray-900">{enrollment.student_name}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Email:</span>
              <span className="ml-2 text-gray-900">{enrollment.student_email}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Course:</span>
              <span className="ml-2 text-gray-900">{enrollment.course_title}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Batch:</span>
              <span className="ml-2 text-gray-900">{enrollment.batch_name}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Enrolled:</span>
              <span className="ml-2 text-gray-900">
                {new Date(enrollment.enrolled_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Status:</span>
              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                enrollment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {enrollment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Course Fee</div>
            <div className="text-2xl font-bold text-gray-900">
              {payment.base_amount.toLocaleString()} <span className="text-sm font-normal">MMK</span>
            </div>
          </div>
          
          {payment.discount_amount > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">Discount</div>
              <div className="text-2xl font-bold text-orange-600">
                -{payment.discount_amount.toLocaleString()} <span className="text-sm font-normal">MMK</span>
              </div>
              {payment.multi_course_discount && (
                <div className="text-xs text-orange-600 mt-1">Multi-course discount</div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-blue-600">
              {payment.total_amount.toLocaleString()} <span className="text-sm font-normal">MMK</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-green-200">
            <div className="text-sm text-gray-600 mb-1">Paid</div>
            <div className="text-2xl font-bold text-green-600">
              {payment.paid_amount.toLocaleString()} <span className="text-sm font-normal">MMK</span>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-sm p-6 border ${
            remaining > 0 ? 'border-red-200' : 'border-gray-200'
          }`}>
            <div className="text-sm text-gray-600 mb-1">Remaining</div>
            <div className={`text-2xl font-bold ${
              remaining > 0 ? 'text-red-600' : 'text-gray-400'
            }`}>
              {remaining.toLocaleString()} <span className="text-sm font-normal">MMK</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Certificate Management</h2>

          {certificateMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-700">Attendance</div>
                <div className="text-lg font-bold text-blue-900">{certificateMetrics.attendance_rate.toFixed(2)}%</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-purple-700">Assignment</div>
                <div className="text-lg font-bold text-purple-900">{certificateMetrics.assignment_rate.toFixed(2)}%</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-xs text-amber-700">Batch Ended</div>
                <div className="text-lg font-bold text-amber-900">{certificateMetrics.batch_ended ? 'Yes' : 'No'}</div>
              </div>
              <div className={`${enrollment.certificate ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-3`}>
                <div className={`text-xs ${enrollment.certificate ? 'text-green-700' : 'text-gray-600'}`}>Certificate Status</div>
                <div className={`text-lg font-bold ${enrollment.certificate ? 'text-green-800' : 'text-gray-700'}`}>
                  {enrollment.certificate ? 'Eligible' : 'Not Eligible'}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
            <button
              type="button"
              onClick={handleCertificateUpload}
              disabled={uploadingCertificate || !certificateFile}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
            >
              {uploadingCertificate ? 'Uploading...' : 'Upload Certificate'}
            </button>
            {enrollment.certificate_url && (
              <a
                href={enrollment.certificate_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition text-center"
              >
                View Current Certificate
              </a>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Rule: Certificate becomes eligible only when batch end date has passed, attendance ≥ 90%, and assignment performance ≥ 90%.
          </p>
        </div>

        {/* Installments */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Payment Installments</h2>
            <p className="text-sm text-gray-600 mt-1">
              Payment plan: {payment.plan_type === 'full' ? 'Full Payment' : '2 Installments'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Installment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Paid Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Notes
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
                {installments.map((installment) => (
                  <tr key={installment.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      #{installment.number}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-semibold">
                      {installment.amount.toLocaleString()} MMK
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(installment.due_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {installment.paid_date 
                        ? new Date(installment.paid_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : '—'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {installment.payment_method || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {installment.notes || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        installment.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : installment.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {installment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {installment.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setSelectedInstallment(installment)
                              setShowPayModal(true)
                            }}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-semibold"
                          >
                            Record Payment
                          </button>
                        )}
                        {installment.status === 'paid' && (
                          <span className="text-sm text-green-600 font-semibold">✓ Paid</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPayModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Record Payment
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Installment #{selectedInstallment.number} - {selectedInstallment.amount.toLocaleString()} MMK
            </p>

            <div className="space-y-4 mb-6">
              {/* Payment Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={paymentForm.paid_date}
                  onChange={(e) => setPaymentForm({...paymentForm, paid_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method <span className="text-red-600">*</span>
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Transaction ID, reference number, etc."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRecordPayment}
                disabled={recording}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recording ? 'Recording...' : 'Confirm Payment'}
              </button>
              <button
                onClick={() => {
                  setShowPayModal(false)
                  setSelectedInstallment(null)
                  setPaymentForm({
                    paid_date: new Date().toISOString().split('T')[0],
                    payment_method: 'KPay',
                    notes: ''
                  })
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
