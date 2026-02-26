'use client'

import Link from 'next/link'
import Image from 'next/image'

interface AdminNavbarProps {
  title: string
  subtitle: string
  userName?: string
  userEmail?: string
  onLogout: () => void
  backHref?: string
  backLabel?: string
}

export default function AdminNavbar({
  title,
  subtitle,
  userName,
  userEmail,
  onLogout,
  backHref,
  backLabel,
}: AdminNavbarProps) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/admin" className="shrink-0">
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
                className="text-gray-600 hover:text-blue-600 transition text-sm font-semibold"
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
