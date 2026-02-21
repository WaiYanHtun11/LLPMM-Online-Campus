import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { CodeRain, FloatingCodeSymbols } from '@/components/CodeElements'

export default async function CoursesPage() {
  // Fetch courses from Supabase
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      *,
      batches:batches(id, status)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // If error, show error state
  if (error) {
    return (
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
    )
  }

  // Count upcoming batches for each course
  const coursesWithBatches = courses?.map(course => ({
    ...course,
    upcomingBatches: course.batches?.filter((b: any) => b.status === 'upcoming').length || 0
  })) || []
  
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
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <nav className="container mx-auto px-4 py-5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
            <Image 
              src="/llpmm-logo.jpg" 
              alt="LLPMM Logo" 
              width={55} 
              height={55}
              className="rounded-full ring-2 ring-blue-100"
            />
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LLPMM Online Campus
              </div>
              <div className="text-xs text-gray-500">Let's Learn Programming - Myanmar</div>
            </div>
          </Link>
          <div className="hidden md:flex gap-8">
            <Link href="/courses" className="text-blue-600 font-semibold border-b-2 border-blue-600">Courses</Link>
            <Link href="/batches" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Batches</Link>
            <Link href="/roadmaps" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Roadmaps</Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">About</Link>
          </div>
          <Link 
            href="/login" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all font-semibold"
          >
            Login
          </Link>
        </nav>
      </header>

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
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <select className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium bg-white">
              <option>🎯 All Levels</option>
              <option>🌱 Beginner</option>
              <option>⚡ Intermediate</option>
              <option>🚀 Advanced</option>
            </select>
            <select className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium bg-white">
              <option>📚 All Categories</option>
              <option>💻 Programming</option>
              <option>🌐 Web Development</option>
              <option>📱 Mobile Development</option>
              <option>🎓 Computer Science</option>
            </select>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="container mx-auto px-4 pb-24">
        {coursesWithBatches.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Courses Available</h3>
            <p className="text-gray-500 text-lg mb-8">Check back soon for new courses!</p>
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
            {coursesWithBatches.map((course) => {
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

                  <div className="p-6 flex flex-col flex-grow">
                    {/* Duration */}
                    <div className="flex justify-end items-center mb-3">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {course.duration}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
                      {course.description}
                    </p>

                    {/* Prerequisites */}
                    {prerequisites.length > 0 && (
                      <div className="mb-4">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prerequisites:</span>
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
                      <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-xl font-bold group-hover:shadow-lg transition-all">
                        View Details →
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

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Image 
                  src="/llpmm-logo.jpg" 
                  alt="LLPMM Logo" 
                  width={50} 
                  height={50}
                  className="rounded-full"
                />
                <div>
                  <h3 className="text-white font-bold text-xl">LLPMM Online Campus</h3>
                  <p className="text-sm text-gray-400">Let's Learn Programming - Myanmar</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering Myanmar's next generation of developers with world-class programming education. 
                Learn, Build, Launch. 🚀
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/LetsLearnProgrammingMyanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://t.me/LetsLearnProgrammingMyanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/></svg>
                </a>
                <a href="https://www.youtube.com/@letslearnprogramming-myanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/courses" className="hover:text-white transition">All Courses</Link></li>
                <li><Link href="/batches" className="hover:text-white transition">Upcoming Batches</Link></li>
                <li><Link href="/roadmaps" className="hover:text-white transition">Learning Roadmaps</Link></li>
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                  contact@llp-myanmar.com
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                  <a href="https://t.me/LetsLearnProgrammingMyanmar" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                    Telegram: @LetsLearnProgrammingMyanmar
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>
                  <a href="https://www.youtube.com/@letslearnprogramming-myanmar" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                    YouTube Channel
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; 2026 Let's Learn Programming - Myanmar. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
