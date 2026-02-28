import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicNavbar from '@/components/PublicNavbar'
import PublicFooter from '@/components/PublicFooter'
import { getAllQuizSlugs, getQuizBySlug } from '@/lib/quizzes-data'
import QuizSession from './QuizSession'

interface QuizDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllQuizSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { slug } = await params
  const quiz = await getQuizBySlug(slug)

  if (!quiz) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar activeHref="/quizzes" includeTestimonials />

      <section className="py-10 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/quizzes" className="text-sm text-blue-600 hover:text-blue-700">← Back to Quizzes</Link>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-3 mb-3">{quiz.title}</h1>
          <p className="text-gray-600 mb-4">{quiz.description}</p>
          <div className="text-sm text-blue-700 font-medium">{quiz.questions.length} questions</div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <QuizSession questions={quiz.questions} slug={slug} quizTitle={quiz.title} />
        </div>
      </section>

      <PublicFooter compact includeTestimonials />
    </div>
  )
}
