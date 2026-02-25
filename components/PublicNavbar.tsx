'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import HomeNavbarAuthButton from '@/components/HomeNavbarAuthButton'

type NavItem = {
  href: string
  label: string
}

interface PublicNavbarProps {
  activeHref?: string
  includeTestimonials?: boolean
}

export default function PublicNavbar({
  activeHref,
  includeTestimonials = false,
}: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/batches', label: 'Batches' },
    { href: '/roadmaps', label: 'Roadmaps' },
    ...(includeTestimonials ? [{ href: '/testimonials', label: 'Testimonials' }] : []),
    { href: '/about', label: 'About' },
  ]

  return (
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
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
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                className={`font-medium transition-all bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
                  item.href === activeHref ? '' : 'hover:from-blue-700 hover:to-pink-600'
                }`}
              >
                {item.label}
              </Link>
              {item.href === activeHref && (
                <div className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              )}
            </div>
          ))}
        </div>

        <div className="ml-auto">
          <HomeNavbarAuthButton />
        </div>
      </nav>

      <div className="h-px bg-gradient-to-r from-blue-200 via-purple-300 to-pink-200"></div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-lg transition-all font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
                  item.href === activeHref
                    ? 'bg-blue-50'
                    : 'hover:bg-blue-50 hover:from-blue-700 hover:to-pink-600'
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
  )
}
