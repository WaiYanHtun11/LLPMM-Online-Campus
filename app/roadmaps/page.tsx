'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import PublicNavbar from '@/components/PublicNavbar'
import PublicFooter from '@/components/PublicFooter'

type Roadmap = {
  id: string
  title: string
  command: string
  steps: string[]
}

const roadmaps: Roadmap[] = [
  {
    id: 'web-dev',
    title: 'Web Developer Roadmap',
    command: '$ roadmap --track web-developer',
    steps: ['C or Python', 'Database', 'UI/UX Design', 'Web Basic', 'Web Intermediate', 'Web Advance'],
  },
  {
    id: 'mobile-dev',
    title: 'Mobile App Developer Roadmap',
    command: '$ roadmap --track mobile-app',
    steps: ['C or Python','Database','Java', 'UI/UIX Design', 'Dart', 'Flutter'],
  },
]

export default function RoadmapsPage() {
  const [visibleRoadmaps, setVisibleRoadmaps] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const roadmapCards = document.querySelectorAll<HTMLElement>('[data-roadmap-id]')

    if (!roadmapCards.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const roadmapId = entry.target.getAttribute('data-roadmap-id')
          if (!roadmapId) return

          setVisibleRoadmaps((prev) => {
            if (prev[roadmapId]) return prev
            return { ...prev, [roadmapId]: true }
          })
        })
      },
      { threshold: 0.25 }
    )

    roadmapCards.forEach((card) => observer.observe(card))

    return () => {
      roadmapCards.forEach((card) => observer.unobserve(card))
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNavbar activeHref="/roadmaps" includeTestimonials />

      <main className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="rounded-2xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-10">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-slate-100 to-purple-100">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-500 font-mono">roadmaps.sh</span>
              </div>

              <div className="p-6 md:p-8">
                <p className="text-emerald-600 font-mono text-sm mb-3">$ cat learning-roadmaps.md</p>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  Developer Learning Roadmaps
                </h1>
                <p className="text-gray-600 max-w-2xl">
                  Follow these structured paths step-by-step. More roadmaps will be added over time.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roadmaps.map((roadmap) => (
              <div
                key={roadmap.id}
                data-roadmap-id={roadmap.id}
                className="rounded-2xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]"
              >
                <div className="bg-white rounded-2xl h-full overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
                    <p className="text-xs font-mono text-emerald-700 mb-2">{roadmap.command}</p>
                    <h2 className="text-xl font-bold text-gray-900">{roadmap.title}</h2>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="relative">
                      <div
                        className={`absolute left-4 top-3 bottom-3 w-px bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500 origin-top transition-transform duration-700 ease-out ${
                          visibleRoadmaps[roadmap.id] ? 'scale-y-100' : 'scale-y-0'
                        }`}
                      />

                      <div className="space-y-4">
                        {roadmap.steps.map((step, index) => (
                          <div
                            key={`${roadmap.id}-${step}`}
                            className={`relative flex items-center gap-4 transition-all duration-500 ease-out ${
                              visibleRoadmaps[roadmap.id]
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-2'
                            }`}
                            style={{ transitionDelay: `${index * 120}ms` }}
                          >
                            <span className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm">
                              {index + 1}
                            </span>

                            <div className="flex-1 rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
                              <div className="bg-white rounded-xl px-4 py-3.5">
                                <p className="text-xs font-mono text-purple-600 mb-1">STEP {index + 1}</p>
                                <p className="font-semibold text-gray-900">{step}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/batches"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
            >
              Explore Batches
            </Link>
            <Link
              href="/courses"
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Browse Courses
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter includeTestimonials compact />
    </div>
  )
}
