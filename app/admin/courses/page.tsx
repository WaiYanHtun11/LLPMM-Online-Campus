'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import AdminNavbar from '@/components/AdminNavbar'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  duration: string
  fee: number
  category: string
  level: string
  image_url?: string
  is_active: boolean
  created_at: string
}

export default function CoursesManagement() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

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
      fetchCourses()
    }
  }, [userProfile])

  async function fetchCourses() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
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

  const handleDelete = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Delete "${courseTitle}"? This cannot be undone.\n\nThis will also remove all associated batches and enrollments.`)) {
      return
    }

    try {
      setDeleting(courseId)
      setError('')

      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete course')
      }

      // Remove course from local state
      setCourses(courses.filter(c => c.id !== courseId))
      
      alert('Course deleted successfully!')

    } catch (err: any) {
      setError(err.message || 'Failed to delete course')
      alert(`Error: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (courseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !currentStatus })
        .eq('id', courseId)

      if (error) throw error

      // Update local state
      setCourses(courses.map(c => 
        c.id === courseId ? { ...c, is_active: !currentStatus } : c
      ))

    } catch (err: any) {
      setError(err.message || 'Failed to update course status')
      alert(`Error: ${err.message}`)
    }
  }

  const filteredCourses = courses.filter(c => {
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter
    const matchesLevel = levelFilter === 'all' || c.level === levelFilter
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesLevel && matchesSearch
  })

  const levelColors = {
    'Beginner': 'bg-green-100 text-green-800',
    'Intermediate': 'bg-yellow-100 text-yellow-800',
    'Advanced': 'bg-red-100 text-red-800'
  }

  const categoryColors = {
    'Programming Languages': 'bg-purple-100 text-purple-800',
    'Web Development': 'bg-blue-100 text-blue-800',
    'Data Science': 'bg-pink-100 text-pink-800',
    'Mobile Development': 'bg-indigo-100 text-indigo-800',
    'DevOps': 'bg-orange-100 text-orange-800',
    'Other': 'bg-gray-100 text-gray-800'
  }

  const categoryCounts = courses.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
        title="Course Management"
        subtitle="Manage course catalog and offerings"
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
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-green-50 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-green-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-900">{courses.filter(c => c.is_active).length}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-gray-900">{courses.filter(c => !c.is_active).length}</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-blue-50 rounded-xl p-6 shadow-sm">
              <p className="text-sm text-blue-600 mb-1">Categories</p>
              <p className="text-3xl font-bold text-blue-900">{Object.keys(categoryCounts).length}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search courses by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Programming Languages">Programming Languages</option>
              <option value="Web Development">Web Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Mobile Development">Mobile Development</option>
              <option value="DevOps">DevOps</option>
              <option value="Other">Other</option>
            </select>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Create Course Button */}
            <Link
              href="/admin/courses/create"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition whitespace-nowrap"
            >
              + Create Course
            </Link>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500">
                  {searchQuery || categoryFilter !== 'all' || levelFilter !== 'all' 
                    ? 'No courses found matching your filters.' 
                    : 'No courses yet. Create your first course!'}
                </p>
              </div>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] hover:shadow-md transition">
                <div className="bg-white rounded-xl overflow-hidden flex flex-col h-full">
                {/* Course Image */}
                {course.image_url && (
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={course.image_url}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="p-6 flex-grow flex flex-col">
                  {/* Title & Status */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">{course.title}</h3>
                      <button
                        onClick={() => handleToggleActive(course.id, course.is_active)}
                        className={`px-2 py-1 rounded text-xs font-semibold transition ${
                          course.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {course.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                  </div>

                  {/* Category & Level */}
                  <div className="flex gap-2 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[course.category as keyof typeof categoryColors] || categoryColors['Other']}`}>
                      {course.category}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${levelColors[course.level as keyof typeof levelColors]}`}>
                      {course.level}
                    </span>
                  </div>

                  {/* Duration & Price */}
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-4">
                    <span>📅 {course.duration || 'TBD'}</span>
                    <span className="font-bold text-blue-600">{course.fee ? course.fee.toLocaleString() : '0'} MMK</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/admin/courses/${course.id}/edit`}
                      className="flex-1 text-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      disabled={deleting === course.id}
                      className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === course.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Count */}
        {filteredCourses.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        )}
      </main>
    </div>
  )
}
