'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'student'
  phone?: string
  payment_method?: string
  payment_account_name?: string
  payment_account_number?: string
  payment_model?: string
  profit_share_percentage?: number
}

export default function EditUser() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student' as 'admin' | 'instructor' | 'student',
    phone: '',
    // Instructor payment fields
    payment_method: 'KPay',
    payment_account_name: '',
    payment_account_number: '',
    payment_model: 'fixed_salary',
    profit_share_percentage: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    if (userProfile?.role === 'admin' && userId) {
      fetchUser()
    }
  }, [userProfile, userId])

  async function fetchUser() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      
      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'student',
          phone: data.phone || '',
          payment_method: data.payment_method || 'KPay',
          payment_account_name: data.payment_account_name || '',
          payment_account_number: data.payment_account_number || '',
          payment_model: data.payment_model || 'fixed_salary',
          profit_share_percentage: data.profit_share_percentage?.toString() || ''
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.email) {
        throw new Error('Name and email are required')
      }

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || null
      }

      // Add instructor payment fields if role is instructor
      if (formData.role === 'instructor') {
        updateData.payment_method = formData.payment_method || null
        updateData.payment_account_name = formData.payment_account_name || null
        updateData.payment_account_number = formData.payment_account_number || null
        updateData.payment_model = formData.payment_model || null
        updateData.profit_share_percentage = formData.payment_model === 'profit_share' 
          ? parseFloat(formData.profit_share_percentage) || null 
          : null
      } else {
        // Clear instructor fields if role changed from instructor
        updateData.payment_method = null
        updateData.payment_account_name = null
        updateData.payment_account_number = null
        updateData.payment_model = null
        updateData.profit_share_percentage = null
      }

      const { error: dbError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (dbError) throw dbError

      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/users')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Image 
                  src="/llpmm-logo.jpg" 
                  alt="LLPMM Logo" 
                  width={50} 
                  height={50}
                  className="rounded-full cursor-pointer hover:opacity-80 transition"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                <p className="text-sm text-gray-600">Update user information</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/users"
                className="text-gray-600 hover:text-blue-600 transition text-sm font-semibold"
              >
                ← Back to Users
              </Link>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{userProfile?.name}</p>
                <p className="text-xs text-gray-600">{userProfile?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <strong>Success!</strong> User updated successfully. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Note: Email cannot be changed in auth system</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="09xxxxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* Instructor Payment Information */}
          {formData.role === 'instructor' && (
            <div className="mb-8 border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Model
                  </label>
                  <select
                    value={formData.payment_model}
                    onChange={(e) => setFormData({...formData, payment_model: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fixed_salary">Fixed Salary</option>
                    <option value="profit_share">Profit Share</option>
                  </select>
                  {formData.payment_model === 'fixed_salary' && (
                    <p className="text-xs text-gray-500 mt-1">Fixed salary amount is set per batch.</p>
                  )}
                </div>

                {formData.payment_model === 'profit_share' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Profit Share Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.profit_share_percentage}
                      onChange={(e) => setFormData({...formData, profit_share_percentage: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Percentage of batch profit (0-100)</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="KPay">KPay</option>
                    <option value="WavePay">WavePay</option>
                    <option value="CB Pay">CB Pay</option>
                    <option value="AYA Pay">AYA Pay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.payment_account_name}
                    onChange={(e) => setFormData({...formData, payment_account_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Account holder name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Number / Phone
                  </label>
                  <input
                    type="text"
                    value={formData.payment_account_number}
                    onChange={(e) => setFormData({...formData, payment_account_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Account number or phone"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/users"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
