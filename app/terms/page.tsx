import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="rounded-2xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Terms & Conditions</h1>
            <p className="text-sm text-gray-500 mb-8">Last updated: February 23, 2026</p>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
                <p>
                  By using LLPMM Campus, you agree to these terms and conditions. If you do not agree, please discontinue use of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Account Responsibilities</h2>
                <p>
                  You are responsible for keeping your login credentials secure and for all activity under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Course Access and Payments</h2>
                <p>
                  Course access, enrollment, and payment terms are managed through your student account. Fees and installment plans must be completed as agreed.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Acceptable Use</h2>
                <p>
                  You agree not to misuse the platform, attempt unauthorized access, or engage in behavior that disrupts learning activities.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Changes to Terms</h2>
                <p>
                  We may update these terms periodically. Continued use of LLPMM Campus after updates means you accept the revised terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Contact</h2>
                <p>
                  If you have questions about these terms, contact us at <span className="font-semibold">contact.llpmm@gmail.com</span> or <span className="font-semibold">09452784045</span>.
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
