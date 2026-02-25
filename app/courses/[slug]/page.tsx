import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CodeRain, FloatingCodeSymbols, CodeBadge } from '@/components/CodeElements'

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fetch course by slug
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !course) {
    notFound()
  }

  // Fetch upcoming batches for this course
  const { data: batches } = await supabase
    .from('batches')
    .select(`
      *,
      instructor:users!batches_instructor_id_fkey(name)
    `)
    .eq('course_id', course.id)
    .in('status', ['upcoming', 'ongoing'])
    .order('start_date', { ascending: true })
    .limit(3)

  const batchesWithDays = batches?.map(batch => {
    const startDate = new Date(batch.start_date)
    const today = new Date()
    const daysAway = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      ...batch,
      daysAway,
      formattedStartDate: startDate.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    }
  }) || []

  const levelColors = {
    'Beginner': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    'Intermediate': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
    'Advanced': 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
  }

  const categoryColors = {
    'Programming': 'from-blue-500 to-blue-600',
    'Web Development': 'from-purple-500 to-purple-600',
    'Mobile': 'from-pink-500 to-pink-600',
    'Database': 'from-green-500 to-green-600',
    'DevOps': 'from-orange-500 to-orange-600'
  }

  const levelColor = levelColors[course.level as keyof typeof levelColors] || 'bg-gray-100 text-gray-700'
  const categoryGradient = categoryColors[course.category as keyof typeof categoryColors] || 'from-gray-500 to-gray-600'
  const rawOutlines = Array.isArray(course.outlines) ? course.outlines : []
  const learningOutcomes = Array.isArray(course.learning_outcomes) ? course.learning_outcomes : []

  const parseOutlineText = (text: string) => {
    const sections: Array<{ title: string; items: string[] }> = []
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    let current: { title: string; items: string[] } | null = null

    for (const line of lines) {
      const isDivider = /^-+$/.test(line)
      const isItem = /^([\u2705]|[-•])\s*/.test(line)

      if (isDivider) {
        continue
      }

      if (!isItem) {
        if (current) {
          sections.push(current)
        }
        current = { title: line, items: [] }
        continue
      }

      const cleaned = line.replace(/^([\u2705]|[-•])\s*/, '')
      if (!current) {
        current = { title: 'Outline', items: [] }
      }
      current.items.push(cleaned)
    }

    if (current) {
      sections.push(current)
    }

    return sections
  }

  const outlines = rawOutlines.flatMap((entry: any) => {
    if (typeof entry === 'string') {
      return parseOutlineText(entry)
    }

    return [entry]
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <nav className="container mx-auto px-4 py-5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
            <Image 
              src="/llpmm-logo.jpg" 
              alt="LLPMM Logo" 
              width={50} 
              height={50}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-gray-900">LLPMM Online Campus</span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/courses" className="text-blue-600 font-bold">Courses</Link>
            <Link href="/batches" className="hover:text-blue-600 transition font-medium">Upcoming Batches</Link>
            <Link href="/roadmaps" className="hover:text-blue-600 transition font-medium">Roadmaps</Link>
            <Link href="/about" className="hover:text-blue-600 transition font-medium">About</Link>
          </div>
          <Link 
            href="/login" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-md"
          >
            Login
          </Link>
        </nav>
      </header>

      {/* Hero Section with Course Image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <CodeRain />
        <FloatingCodeSymbols />
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <Link href="/" className="hover:text-blue-600 transition">Home</Link>
              <span>/</span>
              <Link href="/courses" className="hover:text-blue-600 transition">Courses</Link>
              <span>/</span>
              <span className="text-gray-900 font-semibold">{course.title}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Course Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${levelColor}`}>
                    {course.level}
                  </span>
                  <CodeBadge>{course.category}</CodeBadge>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
                  <span className={`bg-gradient-to-r ${categoryGradient} bg-clip-text text-transparent`}>
                    {course.title}
                  </span>
                </h1>

                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {course.description}
                </p>

                {/* Course Meta */}
                <div className="flex flex-wrap gap-6 mb-8">
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">{course.duration_weeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="font-semibold">{course.level} Level</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {course.fee?.toLocaleString()} MMK
                    </span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="https://t.me/LLP_MM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-center"
                  >
                    Enroll Now
                  </a>
                  <Link 
                    href="/batches"
                    className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition text-center"
                  >
                    View Batches
                  </Link>
                </div>
              </div>

              {/* Right: Course Image */}
              <div className="relative">
                {course.image_url ? (
                  <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                    <Image
                      src={course.image_url}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>
                ) : (
                  <div className={`h-96 rounded-2xl bg-gradient-to-br ${categoryGradient} flex items-center justify-center shadow-2xl`}>
                    <div className="text-9xl">📚</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prerequisites Section */}
      {course.prerequisites && course.prerequisites.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                <span className="text-blue-600 font-mono">{'if ('}</span>
                Prerequisites
                <span className="text-blue-600 font-mono">{') { }'}</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {course.prerequisites.map((prereq: string, index: number) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-gray-700 font-medium"
                  >
                    ✓ {prereq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Course Outline Section */}
      {outlines.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Course Outline
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {outlines.map((outline: any, index: number) => {
                  const title = outline?.title || `Module ${index + 1}`
                  const items = Array.isArray(outline?.items) ? outline.items : []

                  return (
                    <div key={index} className="bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 p-[1px] rounded-xl">
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Module {index + 1}</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
                        {items.length > 0 ? (
                          <ul className="space-y-2 text-sm text-gray-600">
                            {items.map((item: string, itemIndex: number) => (
                              <li key={itemIndex} className="flex items-start gap-2">
                                <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {outline?.description || 'Outline details coming soon.'}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Learning Outcomes Section */}
      {learningOutcomes.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-gray-900">
                Learning Outcomes
              </h2>
              <div className="bg-gradient-to-r from-emerald-200 via-green-200 to-emerald-200 p-[1px] rounded-xl">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <ul className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
                    {learningOutcomes.map((outcome: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="mt-0.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Batches Section */}
      {batchesWithDays.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Upcoming Batches
                  </span>
                </h2>
                <Link 
                  href="/batches"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {batchesWithDays.map((batch) => (
                  <div key={batch.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-gray-900 font-mono">
                        {batch.name}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {batch.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{batch.formattedStartDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-blue-600 font-bold">
                          Starts in {batch.daysAway} {batch.daysAway === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{batch.instructor?.name || 'TBA'}</span>
                      </div>
                    </div>

                    <a 
                      href="https://t.me/LLP_MM"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
                    >
                      Enroll
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNHY1YzAgMi43NiAyLjI0IDUgNSA1czUtMi4yNCA1LTV2LTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Ready to Learn {course.title}?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90">
              Join our next batch and start building real projects
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://t.me/LLP_MM" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-10 py-5 rounded-full text-lg font-bold hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 inline-flex items-center gap-2 justify-center"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                Contact on Telegram
              </a>
              <Link 
                href="/courses"
                className="bg-transparent border-2 border-white text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-white hover:text-blue-600 transition-all inline-flex items-center gap-2 justify-center"
              >
                Browse More Courses
              </Link>
            </div>
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
                <h3 className="text-white font-bold text-lg">LLPMM Online Campus</h3>
              </div>
              <p className="text-sm mb-6 leading-relaxed">
                Let's Learn Programming - Myanmar<br />
                Your gateway to programming excellence. Join 8,870+ students building their future in tech.
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/LetsLearnProgrammingMyanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://t.me/LLP_MM" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/></svg>
                </a>
                <a href="https://www.youtube.com/@letslearnprogramming-myanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="hover:text-white transition">Courses</Link></li>
                <li><Link href="/batches" className="hover:text-white transition">Upcoming Batches</Link></li>
                <li><Link href="/roadmaps" className="hover:text-white transition">Learning Roadmaps</Link></li>
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                  contact.llpmm@gmail.com
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                  09452784045
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Let's Learn Programming - Myanmar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
