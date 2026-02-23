import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="rounded-2xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: February 23, 2026</p>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
                <p>
                  We collect basic account information such as your name, email address, and course enrollment data to provide learning services on LLPMM Campus.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
                <p>
                  Your information is used to manage your account, enrollments, attendance, assignments, payment tracking, and to improve our educational services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Data Sharing</h2>
                <p>
                  We do not sell your personal information. Data is only shared when required to operate the platform securely or when required by law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Data Security</h2>
                <p>
                  We use industry-standard security measures to protect your information. However, no online system can guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Contact</h2>
                <p>
                  For privacy-related questions, contact us at <span className="font-semibold">contact.llpmm@gmail.com</span> or call <span className="font-semibold">09452784045</span>.
                </p>
              </section>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
