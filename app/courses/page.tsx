'use client'

import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { CodeRain, FloatingCodeSymbols } from '@/components/CodeElements'
import { useState, useEffect } from 'react'
import PublicNavbar from '@/components/PublicNavbar'
import PublicFooter from '@/components/PublicFooter'

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('courses')
          .select(`
            *,
            batches:batches(id, status)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
        
        if (dbError) throw dbError
        setCourses(data || [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourses()
  }, [])
  
  // Calculate coursesWithBatches
  const coursesWithBatches = courses.map(course => ({
    ...course,
    upcomingBatches: course.batches?.filter((b: any) => b.status === 'upcoming').length || 0
  }))

  const availableLevels = Array.from(new Set(coursesWithBatches.map((course) => course.level).filter(Boolean)))
  const availableCategories = Array.from(new Set(coursesWithBatches.map((course) => course.category).filter(Boolean)))

  const filteredCourses = coursesWithBatches.filter((course) => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const matchesSearch =
      normalizedSearch.length === 0 ||
      course.title?.toLowerCase().includes(normalizedSearch) ||
      course.description?.toLowerCase().includes(normalizedSearch) ||
      course.category?.toLowerCase().includes(normalizedSearch)

    const matchesLevel = levelFilter === 'all' || course.level === levelFilter
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter

    return matchesSearch && matchesLevel && matchesCategory
  })
  
  const levelColors = {
    'Beginner': 'bg-green-100 text-green-700 border-green-200',
    'Intermediate': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Advanced': 'bg-red-100 text-red-700 border-red-200'
  }

  const categoryIcons: Record<string, string> = {
    'Programming': '💻',
    'Web Development': '🌐',
    'Mobile Development': '📱',
    'Computer Science': '🎓',
    'Data Science': '📊',
    'DevOps': '⚙️'
  }

  const categoryGradients: Record<string, string> = {
    'Programming': 'from-blue-500 to-blue-600',
    'Web Development': 'from-purple-500 to-purple-600',
    'Mobile Development': 'from-pink-500 to-pink-600',
    'Computer Science': 'from-indigo-500 to-indigo-600',
    'Data Science': 'from-green-500 to-green-600',
    'DevOps': 'from-orange-500 to-orange-600'
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Error State */}
      {error && (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md border border-red-100">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Database Error</h1>
            <p className="text-gray-700 mb-6">{error.message}</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      )}

      {!error && (
        <>
          <PublicNavbar activeHref="/courses" includeTestimonials />
        </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600">Loading courses...</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Code Rain Effect */}
        <CodeRain />
        
        {/* Floating Code Symbols */}
        <FloatingCodeSymbols />
        
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-8 border border-blue-100">
              <span className="text-2xl">🎓</span>
              <span className="text-sm font-semibold text-gray-700">{coursesWithBatches.length} Courses Available</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Master Your Craft
              </span>
              <br />
              <span className="text-gray-900">One Course at a Time</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              From Python fundamentals to advanced web frameworks. 
              <span className="font-semibold text-gray-800"> Choose your path and start building.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search courses by name or keyword..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium bg-white"
            >
              <option value="all">🎯 All Levels</option>
              {availableLevels.map((level) => (
                <option key={level} value={level}>
                  {level === 'Beginner' ? '🌱' : level === 'Intermediate' ? '⚡' : level === 'Advanced' ? '🚀' : '🎯'} {level}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium bg-white"
            >
              <option value="all">📚 All Categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {categoryIcons[category] || '📖'} {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setLevelFilter('all')
                setCategoryFilter('all')
              }}
              className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="container mx-auto px-4 pb-24">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {coursesWithBatches.length === 0 ? 'No Courses Available' : 'No Courses Match Your Filters'}
            </h3>
            <p className="text-gray-500 text-lg mb-8">
              {coursesWithBatches.length === 0
                ? 'Check back soon for new courses!'
                : 'Try changing search text, level, or category filters.'}
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => {
              const prerequisites = Array.isArray(course.prerequisites) ? course.prerequisites : []
              const categoryGradient = categoryGradients[course.category] || 'from-gray-500 to-gray-600'
              const categoryIcon = categoryIcons[course.category] || '📖'
              
              return (
                <div key={course.id} className="bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 p-[1px] rounded-2xl h-full">
                <Link 
                  href={`/courses/${course.slug}`}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col h-full"
                >
                  {/* Course Header with Image or Gradient */}
                  <div className="relative h-48 overflow-hidden">
                    {course.image_url ? (
                      <>
                        <img 
                          src={course.image_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      </>
                    ) : (
                      <>
                        <div className={`bg-gradient-to-br ${categoryGradient} h-full flex items-center justify-center relative`}>
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                            {categoryIcon}
                          </div>
                        </div>
                      </>
                    )}
                    {/* Floating badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${levelColors[course.level as keyof typeof levelColors]} backdrop-blur-sm bg-white/90`}>
                        {course.level}
                      </span>
                    </div>
                    {/* Category badge */}
                    <div className="absolute bottom-4 left-4 z-10">
                      <span className="px-3 py-2 rounded-lg text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-800 flex items-center gap-2">
                        <span>{categoryIcon}</span>
                        <span>{course.category}</span>
                      </span>
                    </div>
                  </div>

                  {/* Terminal strip */}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">course.config.ts</span>
                    <span className="text-[11px] text-emerald-400 font-mono">/{course.slug}</span>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    {/* Duration */}
                    <div className="flex justify-start items-center mb-3">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">duration</span>
                        {course.duration}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs font-mono text-gray-500 mb-3">{`const coursePath = '/courses/${course.slug}'`}</p>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
                      {course.description}
                    </p>

                    {/* Prerequisites */}
                    {prerequisites.length > 0 && (
                      <div className="mb-4">
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">prerequisites</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {prerequisites.map((prereq: string, idx: number) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                              {prereq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer - This stays at the bottom */}
                    <div className="mt-auto">
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100 mb-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Course Fee</div>
                          <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {course.fee.toLocaleString()} MMK
                          </div>
                          <div className="text-xs text-gray-500 mt-1">💳 2 installments OK</div>
                        </div>
                        <div className="text-right">
                          {course.upcomingBatches > 0 ? (
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {course.upcomingBatches}
                              </div>
                              <div className="text-xs text-gray-500">
                                batch{course.upcomingBatches > 1 ? 'es' : ''} available
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </div>

                      {/* View Course Button - Always at bottom */}
                      <div className="w-full bg-gray-900 border border-gray-700 text-center py-3 rounded-xl font-mono text-sm font-semibold group-hover:bg-gray-800 group-hover:border-emerald-400/60 transition-all">
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{'cat ./course-details.md'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNHY1YzAgMi43NiAyLjI0IDUgNSA1czUtMi4yNCA1LTV2LTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="container mx-auto px-4 relative text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Found Your Perfect Course?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90">
              Check out upcoming batch schedules and secure your spot today
            </p>
            <Link 
              href="/batches" 
              className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-5 rounded-full text-lg font-bold hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Upcoming Batches
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter showLegalLinks showFaq />
          </>
        )}
    </div>
  )
}
