import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { CodeRain, FloatingCodeSymbols } from '@/components/CodeElements'

export default async function BatchesPage() {
  // Fetch upcoming batches with course and instructor info
  const { data: batches, error } = await supabase
    .from('batches')
    .select(`
      *,
      course:courses(title, slug, level, fee, image_url),
      instructor:users!batches_instructor_id_fkey(name)
    `)
    .in('status', ['upcoming', 'ongoing'])
    .order('start_date', { ascending: true })

  // If error, show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Database Error</h1>
          <p className="text-gray-700 mb-4">{error.message}</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Calculate days away from start date
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

  // Group batches by timeline
  const startingSoon = batchesWithDays.filter(b => b.daysAway <= 14 && b.daysAway >= 0)
  const thisMonth = batchesWithDays.filter(b => b.daysAway > 14 && b.daysAway <= 45)
  const later = batchesWithDays.filter(b => b.daysAway > 45)
  
  const levelColors = {
    'Beginner': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    'Intermediate': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
    'Advanced': 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
  }

  const statusColors = {
    'upcoming': 'bg-blue-100 text-blue-700 border-blue-300',
    'ongoing': 'bg-green-100 text-green-700 border-green-300',
    'completed': 'bg-gray-100 text-gray-700 border-gray-300'
  }

  // Batch Card Component
  function BatchCard({ batch, highlight = false }: { batch: any, highlight?: boolean }) {
    const levelColor = levelColors[batch.course?.level as keyof typeof levelColors] || 'bg-gray-100 text-gray-700'
    const statusColor = statusColors[batch.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'
    
    return (
      <div className={`bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 p-[1px] rounded-2xl ${highlight ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 overflow-hidden flex flex-col">
        {/* Course Image Header */}
        {batch.course?.image_url ? (
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
            <Image
              src={batch.course.image_url}
              alt={batch.course.title}
              fill
              className="object-cover hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            {/* Badges on image */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${levelColor}`}>
                {batch.course?.level}
              </span>
              {highlight && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg animate-pulse">
                  🔥 Starting Soon
                </span>
              )}
            </div>
            
            {/* Course title on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white drop-shadow-lg">
                {batch.course?.title}
              </h3>
            </div>
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
            <div className="text-6xl">📚</div>
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${levelColor}`}>
                {batch.course?.level}
              </span>
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="p-6 flex flex-col flex-grow">
          {/* Batch Name */}
          <h4 className="text-lg font-bold text-gray-900 mb-3">
            <span className="text-blue-600 font-mono">{'class '}</span>
            {batch.name}
            <span className="text-blue-600 font-mono">{' { }'}</span>
          </h4>

          {/* Info Grid */}
          <div className="space-y-3 mb-4 flex-grow">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">Start Date:</span>
              <span>{batch.formattedStartDate}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Starts in:</span>
              <span className="text-blue-600 font-bold">
                {batch.daysAway} {batch.daysAway === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-semibold">Instructor:</span>
              <span>{batch.instructor?.name || 'TBA'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold">Capacity:</span>
              <span>{batch.max_students} students</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Fee:</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {batch.course?.fee?.toLocaleString()} MMK
              </span>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                {batch.status}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <a 
              href="https://t.me/LLP_MM"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Enroll Now
            </a>
          </div>
        </div>
      </div>
      </div>
    )
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
              width={50} 
              height={50}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-gray-900">LLPMM Online Campus</span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/courses" className="hover:text-blue-600 transition font-medium">Courses</Link>
            <Link href="/batches" className="text-blue-600 font-bold">Upcoming Batches</Link>
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Code Rain Effect */}
        <CodeRain />
        
        {/* Floating Code Symbols */}
        <FloatingCodeSymbols />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-8 border border-blue-100">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {batchesWithDays.length} Batches Available
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Upcoming
              </span>
              <br />
              <span className="text-gray-900 font-mono">{'<Batches />'}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              Join our <span className="font-bold text-gray-800">live cohorts</span> and learn with fellow developers. 
              Limited seats available!
            </p>
          </div>
        </div>
      </section>

      {/* No Batches State */}
      {batchesWithDays.length === 0 && (
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-8xl mb-8">📅</div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">No Upcoming Batches</h2>
            <p className="text-xl text-gray-600 mb-8">
              Check back soon for new batch announcements! Follow us on social media for updates.
            </p>
            <Link 
              href="/courses" 
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow-lg text-lg"
            >
              Browse Courses
            </Link>
          </div>
        </section>
      )}

      {/* Starting Soon Section */}
      {startingSoon.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <FloatingCodeSymbols />
          </div>
          <div className="container mx-auto px-4 relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-4xl">🔥</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                  Starting <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Soon</span>
                </h2>
              </div>
              <span className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold animate-pulse">
                Next 2 Weeks
              </span>
            </div>
            <p className="text-lg text-gray-600 mb-8">
              Limited spots remaining! Enroll now to secure your seat.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {startingSoon.map((batch) => (
                <BatchCard key={batch.id} batch={batch} highlight={true} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* This Month Section */}
      {thisMonth.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-4xl">📆</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                This <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Month</span>
              </h2>
            </div>
            <p className="text-lg text-gray-600 mb-8">
              Plan ahead and reserve your spot in these upcoming batches.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {thisMonth.map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Later Section */}
      {later.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-4xl">🗓️</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Coming <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Soon</span>
              </h2>
            </div>
            <p className="text-lg text-gray-600 mb-8">
              Get ready for these future batches. Early enrollment discounts may apply!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {later.map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
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
              Ready to Start?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90">
              Contact us on Telegram to reserve your spot in any batch
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://t.me/LetsLearnProgrammingMyanmar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-10 py-5 rounded-full text-lg font-bold hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 inline-flex items-center gap-2 justify-center"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                Contact on Telegram
              </a>
              <a 
                href="mailto:contact@llp-myanmar.com"
                className="bg-transparent border-2 border-white text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-white hover:text-blue-600 transition-all inline-flex items-center gap-2 justify-center"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us
              </a>
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
                <a href="https://t.me/LetsLearnProgrammingMyanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
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
                  contact@llp-myanmar.com
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                  <a href="https://t.me/LetsLearnProgrammingMyanmar" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                    @LetsLearnProgrammingMyanmar
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
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Let's Learn Programming - Myanmar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
