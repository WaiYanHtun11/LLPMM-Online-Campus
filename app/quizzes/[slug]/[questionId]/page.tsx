import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicNavbar from '@/components/PublicNavbar'
import PublicFooter from '@/components/PublicFooter'
import { getQuizBySlug } from '@/lib/quizzes-data'
import type { QuizQuestion } from '@/lib/quizzes-data'
import { toQuestionPreviewText } from '@/lib/quiz-question-utils'
import SharedQuestionClient from './SharedQuestionClient'

interface SharedQuestionPageProps {
  params: Promise<{ slug: string; questionId: string }>
}

function resolveQuestionByParam(questions: QuizQuestion[], questionParam: string) {
  const parsed = Number.parseInt(questionParam, 10)

  if (Number.isNaN(parsed)) {
    return null
  }

  const byId = questions.find((question) => question.id === parsed)
  if (byId) {
    return byId
  }

  if (parsed >= 1 && parsed <= questions.length) {
    return questions[parsed - 1]
  }

  return null
}

export async function generateMetadata({ params }: SharedQuestionPageProps): Promise<Metadata> {
  const { slug, questionId } = await params
  const quiz = await getQuizBySlug(slug)

  if (!quiz) {
    return {
      title: 'Quiz not found',
    }
  }

  const question = resolveQuestionByParam(quiz.questions, questionId)

  if (!question) {
    return {
      title: `${quiz.title} | Question not found`,
    }
  }

  const previewText = toQuestionPreviewText(question.question)
  const pageUrl = `/quizzes/${slug}/${question.id}`
  const imageUrl = `${pageUrl}/opengraph-image`

  return {
    title: `${quiz.title} • Question ${question.id}`,
    description: previewText,
    openGraph: {
      title: `${quiz.title} • Question ${question.id}`,
      description: previewText,
      url: pageUrl,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${quiz.title} question preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${quiz.title} • Question ${question.id}`,
      description: previewText,
      images: [imageUrl],
    },
  }
}

export default async function SharedQuestionPage({ params }: SharedQuestionPageProps) {
  const { slug, questionId } = await params
  const quiz = await getQuizBySlug(slug)

  if (!quiz) {
    notFound()
  }

  const question = resolveQuestionByParam(quiz.questions, questionId)

  if (!question) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar activeHref="/quizzes" includeTestimonials />

      <section className="py-10 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href={`/quizzes/${slug}`} className="text-sm text-blue-600 hover:text-blue-700">← Back to {quiz.title}</Link>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-3 mb-3">{quiz.title}</h1>
          <p className="text-gray-600 mb-4">Answer this shared question and continue with the full quiz.</p>
          <div className="text-sm text-blue-700 font-medium">Question #{question.id}</div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <SharedQuestionClient question={question} slug={slug} />
        </div>
      </section>

      <PublicFooter compact includeTestimonials />
    </div>
  )
}
