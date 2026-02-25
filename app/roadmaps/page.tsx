'use client'

import Link from 'next/link'
import PublicNavbar from '@/components/PublicNavbar'

export default function RoadmapsComingSoonPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar activeHref="/roadmaps" includeTestimonials />

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
