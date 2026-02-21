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
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all font-semibold"
      >
        Dashboard
      </Link>
    )
  }

  return (
    <Link
      href="/login"
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all font-semibold"
    >
      Login
    </Link>
  )
}
