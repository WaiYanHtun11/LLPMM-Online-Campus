import Link from 'next/link'
import PublicNavbar from '@/components/PublicNavbar'
import PublicFooter from '@/components/PublicFooter'
import { getAllQuizSlugs, getQuizBySlug } from '@/lib/quizzes-data'
import GenerateLinkClient from './GenerateLinkClient'

interface GenerateQuizOption {
  slug: string
  title: string
  questionIds: number[]
}

export default async function QuizGeneratePage() {
  const slugs = await getAllQuizSlugs()

  const options: GenerateQuizOption[] = (
    await Promise.all(
      slugs.map(async (slug) => {
        const quiz = await getQuizBySlug(slug)

        if (!quiz) {
          return null
        }

        const questionIds = quiz.questions
          .map((question) => question.id)
          .filter((id): id is number => Number.isFinite(id))

        if (questionIds.length === 0) {
          return null
        }

        return {
          slug,
          title: quiz.title,
          questionIds,
        }
      })
    )
  ).filter((item): item is GenerateQuizOption => item !== null)

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar activeHref="/quizzes" includeTestimonials />

      <section className="py-10 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/quizzes" className="text-sm text-blue-600 hover:text-blue-700">← Back to Quizzes</Link>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-3 mb-3">Generate Random Quiz Link</h1>
          <p className="text-gray-600 mb-4">Generate one random shareable question link like /quizzes/mysql/7.</p>
          <div className="text-sm text-blue-700 font-medium">{options.length} quiz categories available</div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          {options.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-gray-700">
              No quiz data found. Add JSON files under app/quizzes/json.
            </div>
          ) : (
            <GenerateLinkClient options={options} />
          )}
        </div>
      </section>

      <PublicFooter compact includeTestimonials />
    </div>
  )
}
