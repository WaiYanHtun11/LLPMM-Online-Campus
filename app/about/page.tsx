import Link from 'next/link'
import Image from 'next/image'
import { CodeRain, FloatingCodeSymbols, CodeBadge } from '@/components/CodeElements'

export default function AboutPage() {
  const technologies = [
    { name: 'C', icon: '🔷', color: 'from-blue-500 to-blue-600', category: 'Systems Programming' },
    { name: 'C++', icon: '🔶', color: 'from-indigo-500 to-indigo-600', category: 'Systems Programming' },
    { name: 'C#', icon: '💜', color: 'from-purple-500 to-purple-600', category: 'Application Development' },
    { name: 'Python', icon: '🐍', color: 'from-yellow-500 to-green-500', category: 'General Purpose' },
    { name: 'Java', icon: '☕', color: 'from-red-500 to-orange-500', category: 'Enterprise Development' },
    { name: 'JavaScript', icon: '⚡', color: 'from-yellow-400 to-yellow-500', category: 'Web Development' },
    { name: 'React', icon: '⚛️', color: 'from-blue-400 to-cyan-400', category: 'Web Development' },
    { name: 'Flutter', icon: '📱', color: 'from-blue-500 to-sky-400', category: 'Mobile Development' },
    { name: 'UI/UX', icon: '🎨', color: 'from-pink-500 to-rose-500', category: 'Design' },
  ]

  const stats = [
    { number: '8,870+', label: 'Students Taught', icon: '👨‍🎓' },
    { number: '152+', label: 'Video Lessons', icon: '🎥' },
    { number: '6+', label: 'Active Courses', icon: '📚' },
    { number: '4.8★', label: 'Average Rating', icon: '⭐' },
  ]

  const values = [
    {
      icon: '💡',
      title: 'Practical Learning',
      description: 'Learn by building real projects, not just watching videos. Every concept comes with hands-on practice.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: '🇲🇲',
      title: 'Myanmar-Focused',
      description: 'Content designed specifically for Myanmar learners. Taught in Burmese with local context and examples.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '🤝',
      title: 'Community Support',
      description: 'Join a thriving community of 8,870+ students. Network, collaborate, and grow together.',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: '🎯',
      title: 'Career-Focused',
      description: 'Learn skills that companies actually need. From fundamentals to job-ready expertise.',
      color: 'from-purple-500 to-pink-500'
    },
  ]

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
            <Link href="/batches" className="hover:text-blue-600 transition font-medium">Upcoming Batches</Link>
            <Link href="/roadmaps" className="hover:text-blue-600 transition font-medium">Roadmaps</Link>
            <Link href="/about" className="text-blue-600 font-bold">About</Link>
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
        <CodeRain />
        <FloatingCodeSymbols />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-8 border border-blue-100">
              <span className="text-2xl">🇲🇲</span>
              <span className="text-sm font-semibold text-gray-700">Empowering Myanmar Developers Since 2021</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Let's Learn
              </span>
              <br />
              <span className="text-gray-900 font-mono">{'<Programming />'}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              Myanmar's leading online programming education platform. 
              <span className="font-bold text-gray-800"> We teach real skills for real careers.</span>
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <CodeBadge>{'since(2021)'}</CodeBadge>
              <CodeBadge>{'students > 8870'}</CodeBadge>
              <CodeBadge>{'rating === 4.8'}</CodeBadge>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-extrabold mb-2">{stat.number}</div>
                <div className="text-blue-100 text-sm uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 text-center">
              <span className="text-gray-900">Our </span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Story</span>
            </h2>
            
            <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-6">
              <p className="text-xl">
                Founded in 2021, <span className="font-bold text-gray-900">Let's Learn Programming - Myanmar</span> started 
                with a simple mission: make quality programming education accessible to every Myanmar student.
              </p>
              
              <p>
                What began as a YouTube channel has grown into Myanmar's most trusted online programming academy, 
                serving over <span className="font-bold text-blue-600">8,870+ students</span> across the country.
              </p>

              <p>
                We believe that <span className="font-bold">everyone can code</span> — regardless of their background, 
                education level, or location. Our courses are designed in <span className="font-bold text-green-600">Burmese</span>, 
                making complex programming concepts easy to understand for local learners.
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100 my-8">
                <p className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  "Learning to code changed my life. I want to help others experience that same transformation."
                </p>
                <p className="text-center text-gray-600">
                  — <span className="font-semibold">Wai Yan Htun</span>, Founder & Lead Instructor
                </p>
              </div>

              <p>
                Today, we teach everything from foundational programming languages like <span className="font-bold">C, C++, and Python</span>, 
                to modern frameworks like <span className="font-bold">React and Flutter</span>. Our graduates work at top 
                companies in Myanmar and abroad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies We Teach */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Technologies
              </span>
              <span className="text-gray-900"> We Teach</span>
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              From fundamentals to advanced frameworks — master the skills that companies need
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {technologies.map((tech, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-200"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-4">{tech.icon}</div>
                    <h3 className={`text-2xl font-bold mb-2 bg-gradient-to-r ${tech.color} bg-clip-text text-transparent`}>
                      {tech.name}
                    </h3>
                    <p className="text-sm text-gray-600">{tech.category}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-lg text-gray-600 mb-6">
                And many more technologies in <span className="font-bold">Web Development</span>, 
                <span className="font-bold"> Mobile App Development</span>, and <span className="font-bold">UI/UX Design</span>!
              </p>
              <Link 
                href="/courses"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow-lg text-lg"
              >
                Explore All Courses →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">
              <span className="text-gray-900">Why Choose </span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LLPMM</span>
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              What makes us different from other programming courses
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-200"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-lg`}>
                    {value.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Teaching Methods Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">
              <span className="text-gray-900">Our </span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Teaching Methods</span>
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              Choose the learning style that works best for you
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Method 1: Zoom Group Class */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full opacity-10 -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center text-gray-900">
                    Zoom Group Class
                  </h3>
                  <p className="text-gray-700 text-center mb-6 leading-relaxed">
                    Join live interactive classes with fellow students. Learn together, ask questions in real-time, and build connections.
                  </p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Live interactive sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Learn with peers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Real-time Q&A</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Affordable pricing</span>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                </div>
              </div>

              {/* Method 2: One On One Special Class */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-purple-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 rounded-full opacity-10 -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center text-gray-900">
                    One On One Special
                  </h3>
                  <p className="text-gray-700 text-center mb-6 leading-relaxed">
                    Get personalized attention with private lessons. Customized curriculum and pace tailored to your goals.
                  </p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Personalized learning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Flexible schedule</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Custom curriculum</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Faster progress</span>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <span className="inline-block px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold">
                      Premium
                    </span>
                  </div>
                </div>
              </div>

              {/* Method 3: Video Lesson Class */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-3xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-pink-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400 rounded-full opacity-10 -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center text-gray-900">
                    Video Lesson Class
                  </h3>
                  <p className="text-gray-700 text-center mb-6 leading-relaxed">
                    Learn at your own pace with pre-recorded high-quality video lessons. Available on LLPMM Academy platform.
                  </p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Learn anytime, anywhere</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Self-paced learning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Separate platform</span>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <span className="inline-block px-4 py-2 bg-pink-600 text-white rounded-full text-sm font-bold">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200 max-w-3xl mx-auto">
                <p className="text-lg text-gray-700 mb-4">
                  <span className="font-bold text-gray-900">Video Lesson Class</span> will be available on our new dedicated platform —
                  <span className="font-bold text-blue-600"> LLPMM Academy</span> (launching soon!)
                </p>
                <p className="text-gray-600">
                  Stay tuned for updates on our social media channels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <FloatingCodeSymbols />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-12 text-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Meet Your
              </span>
              <span className="text-gray-900"> Instructor</span>
            </h2>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                      <Image 
                        src="/llpmm-logo.jpg" 
                        alt="Wai Yan Htun" 
                        width={96} 
                        height={96}
                        className="rounded-full"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white mb-1">Wai Yan Htun</h3>
                    <p className="text-blue-100 text-lg mb-2">Founder & Lead Instructor</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-semibold">
                        💼 5+ Years Experience
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-semibold">
                        👨‍🎓 8,870+ Students
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-semibold">
                        ⭐ 4.8 Rating
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-10">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Left: About */}
                  <div className="md:col-span-2 space-y-4 text-gray-700 leading-relaxed">
                    <p className="text-lg">
                      <span className="font-bold text-gray-900">Wai Yan Htun</span> is a passionate educator and 
                      experienced software developer based in Myanmar.
                    </p>
                    <p>
                      With over <span className="font-bold text-blue-600">5 years of teaching experience</span>, 
                      he has helped thousands of students transform from complete beginners to professional developers.
                    </p>
                    <p>
                      His teaching style focuses on <span className="font-bold">practical, real-world applications</span> rather 
                      than just theory. Every lesson is designed to build confidence and get students coding from day one.
                    </p>

                    {/* Quote */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-l-4 border-blue-600 mt-6">
                      <p className="text-gray-700 italic">
                        "My goal is simple: help every Myanmar student discover the joy of coding and build 
                        a successful career in tech. Programming changed my life, and I want to share that 
                        transformation with others."
                      </p>
                    </div>
                  </div>

                  {/* Right: Social Links & Stats */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Connect</h4>
                      <div className="space-y-2">
                        <a 
                          href="https://www.youtube.com/@letslearnprogramming-myanmar"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition group"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          <div className="flex-1">
                            <div className="text-xs opacity-90">YouTube</div>
                            <div className="text-sm font-bold">8,870+ Subs</div>
                          </div>
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                        
                        <a 
                          href="https://www.facebook.com/LetsLearnProgrammingMyanmar"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition group"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          <div className="flex-1">
                            <div className="text-xs opacity-90">Facebook</div>
                            <div className="text-sm font-bold">Page</div>
                          </div>
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>

                        <a 
                          href="https://t.me/LetsLearnProgrammingMyanmar"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition group"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/></svg>
                          <div className="flex-1">
                            <div className="text-xs opacity-90">Telegram</div>
                            <div className="text-sm font-bold">Community</div>
                          </div>
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    {/* Expertise */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Teaching</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-blue-600">▸</span>
                          <span>Python & Django</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-purple-600">▸</span>
                          <span>Web Development</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-pink-600">▸</span>
                          <span>React & Next.js</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="text-green-600">▸</span>
                          <span>Mobile Development</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNHY1YzAgMi43NiAyLjI0IDUgNSA1czUtMi4yNCA1LTV2LTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
              Start Your Coding Journey Today
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/90">
              Join 8,870+ students building their future in tech
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/courses"
                className="bg-white text-blue-600 px-10 py-5 rounded-full text-lg font-bold hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 inline-flex items-center gap-2 justify-center"
              >
                Browse Courses
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a 
                href="https://t.me/LetsLearnProgrammingMyanmar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-transparent border-2 border-white text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-white hover:text-blue-600 transition-all inline-flex items-center gap-2 justify-center"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                Contact Us
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
