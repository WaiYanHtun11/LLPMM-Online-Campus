'use client'

import Image from 'next/image'
import Link from 'next/link'

interface InstructorNavbarProps {
  title: string
  subtitle: string
  userName?: string
  userEmail?: string
  onLogout: () => void
  backHref?: string
  backLabel?: string
}

export default function InstructorNavbar({
  title,
  subtitle,
  userName,
  userEmail,
  onLogout,
  backHref,
  backLabel,
}: InstructorNavbarProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/instructor" className="shrink-0">
              <Image
                src="/llpmm-logo.jpg"
                alt="LLPMM Logo"
                width={50}
                height={50}
                className="rounded-full hover:opacity-80 transition"
              />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{title}</h1>
              <p className="text-sm text-gray-600 truncate">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {backHref && backLabel && (
              <Link
                href={backHref}
                className="text-gray-600 hover:text-purple-600 transition text-sm font-semibold"
              >
                {backLabel}
              </Link>
            )}

            <div className="text-right hidden sm:block">
              {userName && <p className="text-sm font-semibold text-gray-900">{userName}</p>}
              {userEmail && <p className="text-xs text-gray-600">{userEmail}</p>}
            </div>

            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
