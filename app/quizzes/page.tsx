import Link from 'next/link'
import PublicNavbar from '@/components/PublicNavbar'
import PublicFooter from '@/components/PublicFooter'
import { getQuizCategoriesWithCounts } from '@/lib/quizzes-data'

export default async function QuizzesPage() {
  const categories = await getQuizCategoriesWithCounts()

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar activeHref="/quizzes" includeTestimonials />

      <section className="py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">Quizzes</h1>
            <p className="text-lg text-gray-600">
              Choose a quiz category and practice with JSON-powered question sets.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4">
          {categories.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center border border-gray-200 rounded-2xl p-10 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No quizzes yet</h2>
              <p className="text-gray-600">Add JSON files in app/quizzes/json and update app/quizzes/category.json.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/quizzes/${category.slug}`}
                  className="rounded-2xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]"
                >
                  <div className="h-full rounded-2xl bg-white p-6 hover:shadow-lg transition-all">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h2>
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                    <div className="text-sm text-blue-700 font-medium">{category.questionCount} questions</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicFooter compact includeTestimonials />
    </div>
  )
}
