'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function RoadmapsComingSoonPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/courses', label: 'Courses' },
    { href: '/batches', label: 'Batches' },
    { href: '/roadmaps', label: 'Roadmaps' },
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
          <div className="hidden md:flex gap-6 items-center flex-1 justify-center">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`font-medium transition-colors ${
                  item.href === '/roadmaps' 
                    ? 'text-blue-600 font-bold' 
                    : 'hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link 
            href="/login" 
            className="ml-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-md text-sm sm:text-base"
          >
            Login
          </Link>
        </nav>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg transition-colors font-medium ${
                    item.href === '/roadmaps'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Coming Soon Content */}
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="text-5xl mb-4">🛣️</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Roadmaps Coming Soon</h1>
            <p className="text-gray-600 mb-8">
              We are preparing structured learning roadmaps to guide your journey from beginner to professional developer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition text-center"
              >
                Back to Home
              </Link>
              <Link
                href="/batches"
                className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
              >
                View Batches
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
