import Link from 'next/link'
import Image from 'next/image'

interface PublicFooterProps {
  includeTestimonials?: boolean
  showLegalLinks?: boolean
  compact?: boolean
  showFaq?: boolean
}

export default function PublicFooter({
  includeTestimonials = false,
  showLegalLinks = false,
  compact = false,
  showFaq = false,
}: PublicFooterProps) {
  if (compact) {
    return (
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image
                src="/llpmm-logo.jpg"
                alt="LLPMM Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-xl font-bold">LLPMM Online Campus</span>
            </div>
            <p className="text-gray-400 mb-6">Let's Learn Programming - Myanmar</p>
            <div className="flex justify-center gap-6 mb-6">
              <Link href="/courses" className="hover:text-blue-400 transition">Courses</Link>
              <Link href="/batches" className="hover:text-blue-400 transition">Batches</Link>
              <Link href="/roadmaps" className="hover:text-blue-400 transition">Roadmaps</Link>
              {includeTestimonials && (
                <Link href="/testimonials" className="hover:text-blue-400 transition">Testimonials</Link>
              )}
              <Link href="/about" className="hover:text-blue-400 transition">About</Link>
            </div>
            <p className="text-sm text-gray-500">© 2026 LLPMM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/llpmm-logo.jpg"
                alt="LLPMM Logo"
                width={50}
                height={50}
                className="rounded-full"
              />
              <div>
                <h3 className="text-white font-bold text-xl">LLPMM Online Campus</h3>
                <p className="text-sm text-gray-400">Let's Learn Programming - Myanmar</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Empowering Myanmar's next generation of developers with world-class programming education.
              Learn, Build, Launch.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/LetsLearnProgrammingMyanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://t.me/LetsLearnProgrammingMyanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/></svg>
              </a>
              <a href="https://www.youtube.com/@letslearnprogramming-myanmar" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/courses" className="hover:text-white transition">All Courses</Link></li>
              <li><Link href="/batches" className="hover:text-white transition">Upcoming Batches</Link></li>
              <li><Link href="/roadmaps" className="hover:text-white transition">Learning Roadmaps</Link></li>
              {includeTestimonials && (
                <li><Link href="/testimonials" className="hover:text-white transition">Testimonials</Link></li>
              )}
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              {showFaq && (
                <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                contact.llpmm@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                09452784045
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2026 Let's Learn Programming - Myanmar. All rights reserved.
          </p>
          {showLegalLinks && (
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
