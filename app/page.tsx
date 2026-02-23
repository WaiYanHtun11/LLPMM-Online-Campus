'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { CodeRain, FloatingCodeSymbols, CodeBadge } from '@/components/CodeElements'
import HomeNavbarAuthButton from '@/components/HomeNavbarAuthButton'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/courses', label: 'Courses' },
    { href: '/batches', label: 'Batches' },
    { href: '/roadmaps', label: 'Roadmaps' },
    { href: '/testimonials', label: 'Testimonials' },
    { href: '/about', label: 'About' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <nav className="container mx-auto px-4 py-3 sm:py-4 flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-all min-w-0">
            <Image 
              src="/llpmm-logo.jpg" 
              alt="LLPMM Logo" 
              width={44} 
              height={44}
              className="rounded-full ring-2 ring-blue-100"
            />
            <div className="min-w-0">
              <div className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                LLPMM Online Campus
              </div>
              <div className="hidden sm:block text-xs text-gray-500">Let's Learn Programming - Myanmar</div>
            </div>
          </Link>
          <div className="hidden md:flex gap-8 flex-1 justify-center">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto">
            <HomeNavbarAuthButton />
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 md:w-96 md:h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Code Rain Effect */}
        <CodeRain />
        
        {/* Floating Code Symbols */}
        <FloatingCodeSymbols />
        
        <div className="container mx-auto px-4 py-16 sm:py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-lg mb-8 border border-blue-100">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-700">🎓 Now Enrolling - 5 Batches Available</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Master Programming
              </span>
              <br />
              <span className="text-gray-900">In Myanmar 🇲🇲</span>
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              Learn Python, Web Development, React, Django & more from expert instructors. 
              <span className="font-semibold text-gray-800"> Build real projects. Get job-ready skills.</span>
            </p>

            {/* Code-style tags */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <CodeBadge>{'<Python />'}</CodeBadge>
              <CodeBadge>{'<JavaScript />'}</CodeBadge>
              <CodeBadge>{'<React />'}</CodeBadge>
              <CodeBadge>{'<Java />'}</CodeBadge>
              <CodeBadge>{'<Flutter />'}</CodeBadge>
              
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/courses" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-7 sm:px-10 py-3.5 sm:py-5 rounded-full text-base sm:text-lg font-bold hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2 group"
              >
                Browse All Courses
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/batches" 
                className="w-full sm:w-auto bg-white text-gray-800 px-7 sm:px-10 py-3.5 sm:py-5 rounded-full text-base sm:text-lg font-bold hover:shadow-xl border-2 border-gray-200 hover:border-blue-300 transition-all inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Upcoming Batches
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 sm:gap-8 justify-center items-center text-gray-600 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">8,870+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                <span className="font-medium">152+ Video Lessons On Youtube</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-5xl font-extrabold mb-2">8.8K+</div>
              <div className="text-blue-100 text-sm uppercase tracking-wide">Students Taught</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-5xl font-extrabold mb-2">152+</div>
              <div className="text-blue-100 text-sm uppercase tracking-wide">Video Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-5xl font-extrabold mb-2">15+</div>
              <div className="text-blue-100 text-sm uppercase tracking-wide">Course Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-5xl font-extrabold mb-2">4.8★</div>
              <div className="text-blue-100 text-sm uppercase tracking-wide">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
              Why Students <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Choose Us</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              We provide everything you need to become a professional developer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
                <span className="text-blue-600 font-mono">{'{ '}</span>
                Expert Instructors
                <span className="text-blue-600 font-mono">{' }'}</span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Learn from experienced developers with real-world industry knowledge and teaching expertise
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
                <span className="text-purple-600 font-mono">{'< '}</span>
                Hands-On Projects
                <span className="text-purple-600 font-mono">{' />'}</span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Build real applications and add impressive projects to your portfolio as you learn
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border border-pink-200">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
                <span className="text-pink-600 font-mono">{'[ '}</span>
                Flexible Payment
                <span className="text-pink-600 font-mono">{' ]'}</span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Split payments into 2 installments. No stress, just focus on learning
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border border-green-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
                <span className="text-green-600 font-mono">{'( '}</span>
                Lifetime Support
                <span className="text-green-600 font-mono">{' )'}</span>
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get help even after course completion. We're here for your entire career journey
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border border-orange-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
                <span className="text-orange-600 font-mono">{'=> '}</span>
                Certificate
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Earn verifiable certificates to showcase your skills to employers
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all hover:-translate-y-2 border border-indigo-200">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
                <span className="text-indigo-600 font-mono">{'// '}</span>
                Community
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Join 8,870+ students. Network, collaborate, and grow together
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Highlights */}
      <section className="py-16 sm:py-20 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
              Popular <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Courses</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Start your programming journey with our most loved courses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {/* Course Card 1 */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 overflow-hidden border border-gray-100 flex flex-col">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-32 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-3 w-fit">Beginner</span>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">Python Fundamentals</h3>
                <p className="text-gray-600 mb-4 flex-grow">Learn Python from scratch. Build real projects and prepare for advanced courses.</p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>⏱️ 8 weeks</span>
                    <span className="font-bold text-gray-900">100,000 MMK</span>
                  </div>
                  <Link href="/courses/python-fundamentals" className="block text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                    View Course
                  </Link>
                </div>
              </div>
            </div>

            {/* Course Card 2 */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 overflow-hidden border border-gray-100 flex flex-col">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 h-32 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-3 w-fit">Beginner</span>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">Web Development</h3>
                <p className="text-gray-600 mb-4 flex-grow">Master HTML, CSS, and JavaScript. Build responsive websites from scratch.</p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>⏱️ 10 weeks</span>
                    <span className="font-bold text-gray-900">120,000 MMK</span>
                  </div>
                  <Link href="/courses/web-dev-basics" className="block text-center bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
                    View Course
                  </Link>
                </div>
              </div>
            </div>

            {/* Course Card 3 */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 overflow-hidden border border-gray-100 flex flex-col">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 h-32 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold mb-3 w-fit">Intermediate</span>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">React & Next.js</h3>
                <p className="text-gray-600 mb-4 flex-grow">Build modern web apps with React and Next.js framework.</p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>⏱️ 10 weeks</span>
                    <span className="font-bold text-gray-900">150,000 MMK</span>
                  </div>
                  <Link href="/courses/react-nextjs-mastery" className="block text-center bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition">
                    View Course
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link 
              href="/courses" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl hover:scale-105 transition-all"
            >
              View All Courses
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Code Terminal Showcase */}
      <section className="py-16 sm:py-20 md:py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Code Rain in dark background */}
        <div className="absolute inset-0 opacity-20">
          <CodeRain />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
                <span className="text-white">Think Like a </span>
                <span className="code-glow text-blue-400 font-mono">&lt;Developer /&gt;</span>
              </h2>
              <p className="text-base sm:text-xl text-gray-400">
                From first line of code to production deployment
              </p>
            </div>

            {/* Terminal Window */}
            <div className="terminal-window max-w-3xl mx-auto overflow-x-auto text-sm sm:text-base">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500"></div>
                <div className="terminal-dot bg-yellow-500"></div>
                <div className="terminal-dot bg-green-500"></div>
                <span className="text-gray-400 text-sm ml-2 font-mono">student@llpmm:~$</span>
              </div>
              <div className="terminal-body">
                <div className="mb-2">
                  <span className="text-green-400">$</span> <span className="text-gray-300">npm install</span> <span className="text-blue-400">@llpmm/knowledge</span>
                </div>
                <div className="mb-4 text-gray-500">
                  ✓ Installing Python fundamentals...<br />
                  ✓ Installing Web Development skills...<br />
                  ✓ Installing Real-world projects...<br />
                  ✓ Installing Career opportunities...
                </div>
                <div className="mb-2">
                  <span className="text-green-400">$</span> <span className="text-gray-300">node</span> <span className="text-yellow-400">start-learning.js</span>
                </div>
                <div className="mb-4">
                  <span className="text-blue-400">{'>'}</span> <span className="text-gray-300">const</span> <span className="text-purple-400">future</span> <span className="text-gray-300">= await</span> <span className="text-yellow-400">learn</span><span className="text-gray-300">()</span>
                </div>
                <div className="text-green-400">
                  ✨ Success! You are now ready to build amazing things.
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-green-400">$</span>
                  <span className="inline-block w-2 h-5 bg-blue-400 ml-2 animate-pulse"></span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 font-mono mb-2">100%</div>
                <div className="text-sm text-gray-400">Hands-on Learning</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 font-mono mb-2">24/7</div>
                <div className="text-sm text-gray-400">Community Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400 font-mono mb-2">∞</div>
                <div className="text-sm text-gray-400">Learning Resources</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 font-mono mb-2">{'<1 yr'}</div>
                <div className="text-sm text-gray-400">To Job-Ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNHY1YzAgMi43NiAyLjI0IDUgNSA1czUtMi4yNCA1LTV2LTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6">
              Ready to Start Your <br />Coding Journey?
            </h2>
            <p className="text-base sm:text-xl md:text-2xl mb-10 text-white/90">
              Join 8,870+ students who are already building their future in tech
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/batches" 
                className="w-full sm:w-auto bg-white text-blue-600 px-7 sm:px-10 py-3.5 sm:py-5 rounded-full text-base sm:text-lg font-bold hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 inline-flex items-center gap-2 justify-center"
              >
                Enroll Today
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a 
                href="https://t.me/LetsLearnProgrammingMyanmar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-7 sm:px-10 py-3.5 sm:py-5 rounded-full text-base sm:text-lg font-bold hover:bg-white hover:text-blue-600 transition-all inline-flex items-center gap-2 justify-center"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                Chat with Us
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
                  contact.llpmm@gmail.com
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                  09452784045
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
