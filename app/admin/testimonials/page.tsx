'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNavbar from '@/components/AdminNavbar'

interface AdminTestimonial {
  id: string
  student_name: string
  instructor_name: string
  course_name: string
  batch_name: string
  rating: number
  testimonial_text: string
  status: 'pending' | 'approved' | 'rejected'
  is_featured: boolean
  created_at: string
}

export default function AdminTestimonialsPage() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'admin') {
        router.push(`/${userProfile.role}`)
      }
    }
  }, [authLoading, user, userProfile, router])

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchTestimonials()
    }
  }, [userProfile])

  async function fetchTestimonials() {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('testimonials')
        .select('id, student_name, instructor_name, course_name, batch_name, rating, testimonial_text, status, is_featured, created_at')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setTestimonials((data || []) as AdminTestimonial[])
    } catch (err: any) {
      setError(err.message || 'Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: AdminTestimonial['status']) {
    try {
      setSavingId(id)
      const { error: updateError } = await supabase
        .from('testimonials')
        .update({ status })
        .eq('id', id)

      if (updateError) throw updateError

      setTestimonials((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      )
    } catch (err: any) {
      alert(err.message || 'Failed to update status')
    } finally {
      setSavingId(null)
    }
  }

  async function toggleFeatured(id: string, isFeatured: boolean) {
    try {
      setSavingId(id)
      const { error: updateError } = await supabase
        .from('testimonials')
        .update({ is_featured: !isFeatured })
        .eq('id', id)

      if (updateError) throw updateError

      setTestimonials((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_featured: !isFeatured } : item
        )
      )
    } catch (err: any) {
      alert(err.message || 'Failed to update featured state')
    } finally {
      setSavingId(null)
    }
  }

  async function deleteTestimonial(id: string) {
    const confirmed = window.confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')
    if (!confirmed) return

    try {
      setSavingId(id)
      const { error: deleteError } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setTestimonials((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete testimonial')
    } finally {
      setSavingId(null)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const total = testimonials.length
  const pending = testimonials.filter((t) => t.status === 'pending').length
  const approved = testimonials.filter((t) => t.status === 'approved').length
  const featured = testimonials.filter((t) => t.is_featured).length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700">Loading testimonials...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar
        title="Manage Testimonials"
        subtitle="Review and moderate student feedback"
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onLogout={handleLogout}
        backHref="/admin"
        backLabel="← Back to Admin"
      />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pending}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approved}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Featured</p>
              <p className="text-2xl font-bold text-purple-600">{featured}</p>
            </div>
          </div>
        </div>

        {testimonials.length === 0 ? (
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
              No testimonials found.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonials.map((item) => (
              <div key={item.id} className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{item.student_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                      {item.is_featured && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.course_name} • {item.batch_name} • Instructor: {item.instructor_name}
                    </p>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">{item.testimonial_text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Rating: {item.rating}/5 • Submitted: {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(() => {
                      const isApproved = item.status === 'approved'
                      return (
                        <>
                    <button
                      onClick={() => updateStatus(item.id, 'approved')}
                      disabled={savingId === item.id || isApproved}
                      className="px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, 'rejected')}
                      disabled={savingId === item.id || isApproved}
                      className="px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => toggleFeatured(item.id, item.is_featured)}
                      disabled={savingId === item.id || isApproved}
                      className="px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {item.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => deleteTestimonial(item.id)}
                      disabled={savingId === item.id}
                      className="px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-slate-500 to-gray-600 text-white hover:from-slate-600 hover:to-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
