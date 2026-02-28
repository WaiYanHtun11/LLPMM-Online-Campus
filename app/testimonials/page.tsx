'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PublicNavbar from '@/components/PublicNavbar'
import PublicFooter from '@/components/PublicFooter'

interface Testimonial {
  id: string
  student_name: string
  instructor_name: string
  rating: number
  testimonial_text: string
  course_name: string
  batch_name: string
  testimonial_date: string
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  async function fetchTestimonials() {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTestimonials(data || [])
    } catch (err) {
      console.error('Error fetching testimonials:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { number: '3,500+', label: 'Happy Students', icon: '😊' },
    { number: '95%', label: 'Success Rate', icon: '🎯' },
    { number: '4.9/5', label: 'Average Rating', icon: '⭐' },
    { number: '20+', label: 'Reviews', icon: '💬' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <PublicNavbar activeHref="/testimonials" includeTestimonials />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full mb-6">
              <span className="text-sm font-semibold">💬 Student Success Stories</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
              What Our Students Say
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Real stories from real students who transformed their careers with LLPMM
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from students who have transformed their careers through LLPMM courses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
              >
                <div className="p-8 h-full flex flex-col">
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.testimonial_text}"
                  </p>

                  <div className="mt-auto">
                    {/* Student Info */}
                    <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold ring-2 ring-blue-100">
                          {testimonial.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{testimonial.student_name}</h4>
                        <p className="text-sm text-gray-600">Instructor: {testimonial.instructor_name}</p>
                      </div>
                    </div>

                    {/* Course & Date */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {testimonial.course_name}
                        </span>
                        <span className="text-gray-400">{testimonial.testimonial_date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter showLegalLinks showFaq />
    </div>
  )
}
