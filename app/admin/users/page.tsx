'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminNavbar from '@/components/AdminNavbar'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'student'
  phone?: string
  payment_method?: string
  payment_account_name?: string
  payment_account_number?: string
  created_at: string
}

export default function UsersManagement() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'instructor' | 'student'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Reset Password Modal State
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    show: boolean
    userId: string | null
    userName: string | null
  }>({ show: false, userId: null, userName: null })
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

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
      fetchUsers()
    }
  }, [userProfile])

  async function fetchUsers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
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

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Delete ${userName}? This cannot be undone.\n\nThis will remove the user from both the database and authentication system.`)) {
      return
    }

    try {
      setDeleting(userId)
      setError('')

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      // Remove user from local state
      setUsers(users.filter(u => u.id !== userId))
      
      // Show success (optional: could add a success message state)
      alert('User deleted successfully!')

    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
      alert(`Error: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordModal.userId || !newPassword) {
      alert('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    try {
      setResetting(true)
      setError('')

      const response = await fetch(`/api/admin/users/${resetPasswordModal.userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }

      alert('Password reset successfully!')
      
      // Close modal and reset state
      setResetPasswordModal({ show: false, userId: null, userName: null })
      setNewPassword('')

    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
      alert(`Error: ${err.message}`)
    } finally {
      setResetting(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    instructor: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800'
  }

  const roleCounts = {
    admin: users.filter(u => u.role === 'admin').length,
    instructor: users.filter(u => u.role === 'instructor').length,
    student: users.filter(u => u.role === 'student').length
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
      <AdminNavbar
        title="User Management"
        subtitle="Manage students, instructors, and admins"
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 transition text-sm font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-purple-50 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-purple-600 mb-1">Admins</p>
              <p className="text-3xl font-bold text-purple-900">{roleCounts.admin}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-blue-50 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-blue-600 mb-1">Instructors</p>
              <p className="text-3xl font-bold text-blue-900">{roleCounts.instructor}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-green-50 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-green-600 mb-1">Students</p>
              <p className="text-3xl font-bold text-green-900">{roleCounts.student}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="instructor">Instructors</option>
                <option value="student">Students</option>
              </select>

              <Link
                href="/admin/users/create"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition whitespace-nowrap"
              >
                + Create User
              </Link>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        {searchQuery || roleFilter !== 'all' ? 'No users found matching your filters.' : 'No users yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{u.name}</p>
                            <p className="text-sm text-gray-600">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleColors[u.role]}`}>
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{u.phone || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(u.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/users/${u.id}/edit`}
                              className="px-3 py-1 text-sm text-white rounded bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition font-semibold shadow-sm"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() =>
                                setResetPasswordModal({
                                  show: true,
                                  userId: u.id,
                                  userName: u.name,
                                })
                              }
                              className="px-3 py-1 text-sm text-white rounded bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={u.id === userProfile?.id}
                            >
                              {u.id === userProfile?.id ? '—' : 'Reset Pwd'}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="px-3 py-1 text-sm text-white rounded bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={u.id === userProfile?.id || deleting === u.id}
                            >
                              {deleting === u.id ? 'Deleting...' : u.id === userProfile?.id ? '—' : 'Delete'}
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

        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </main>

      {/* Reset Password Modal */}
      {resetPasswordModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Reset Password
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Enter a new password for <strong>{resetPasswordModal.userName}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !resetting) {
                    handleResetPassword()
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters. User will need to use this password to log in.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResetPassword}
                disabled={resetting || !newPassword}
                className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                onClick={() => {
                  setResetPasswordModal({ show: false, userId: null, userName: null })
                  setNewPassword('')
                }}
                disabled={resetting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
