'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { CodeRain, FloatingCodeSymbols } from '@/components/CodeElements'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, user, userProfile, loading: authLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      // Redirect based on role
      if (userProfile.role === 'admin') {
        router.push('/admin')
      } else if (userProfile.role === 'instructor') {
        router.push('/instructor')
      } else if (userProfile.role === 'student') {
        router.push('/student')
      }
    }
  }, [user, userProfile, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)
    
    if (result.success) {
      // Redirect will happen automatically via useEffect
    } else {
      setError(result.error || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-purple-100 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_45%)]" />
      <div className="absolute top-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-blue-300/35 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-purple-300/35 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      <CodeRain />
      <FloatingCodeSymbols />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 hover:opacity-80 transition">
            <Image
              src="/llpmm-logo.jpg"
              alt="LLPMM Logo"
              width={56}
              height={56}
              className="rounded-full ring-2 ring-blue-300/60"
            />
            <div className="text-left min-w-0">
              <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                LLPMM Online Campus
              </div>
              <div className="text-xs text-gray-600">let&apos;s_learn_programming()</div>
            </div>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Welcome Back, Developer</h1>
          <p className="text-gray-600 text-sm sm:text-base">Sign in to continue your coding journey</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-blue-300/60 via-cyan-200/50 to-purple-300/60 p-[1px] shadow-2xl">
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/80">
            <div className="mb-5 rounded-lg border border-blue-200 bg-slate-50/90 px-4 py-3 font-mono text-xs sm:text-sm text-slate-700">
              <span className="text-emerald-600">$</span> authenticate --role student|instructor|admin
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-cyan-400 hover:to-purple-400 transition shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs sm:text-sm text-gray-500">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Don&apos;t have an account yet?</p>
              <a
                href="https://t.me/LetsLearnProgrammingMyanmar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full rounded-lg p-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
              >
                <span className="block w-full rounded-lg bg-white py-3 font-semibold hover:bg-cyan-50 transition">
                  <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Contact Admin to Enroll
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
