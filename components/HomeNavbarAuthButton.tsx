'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function HomeNavbarAuthButton() {
  const { user, userProfile } = useAuth()

  const dashboardPath = userProfile?.role ? `/${userProfile.role}` : '/student'

  if (user) {
    return (
      <Link
        href={dashboardPath}
      className="inline-block bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 p-[2px] rounded-[10px] hover:shadow-lg hover:scale-105 transition-all duration-300"
    >
      <span className="block px-3 py-1 rounded-[8px] bg-white font-bold">
        <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </span>
      </span>
    </Link>
    )
  }

  return (
    <Link
    href="/login"
    className="inline-block bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 p-[2px] rounded-[10px] hover:shadow-lg hover:scale-105 transition-all duration-300"
    >
      <span className="block px-3 py-1 rounded-[8px] bg-white font-bold">
        <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Login
        </span>
      </span>
    </Link>
  )
}
