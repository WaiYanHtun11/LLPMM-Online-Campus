import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { getQuizBySlug } from '@/lib/quizzes-data'
import { toQuestionPreviewText } from '@/lib/quiz-question-utils'
import type { QuizQuestion } from '@/lib/quizzes-data'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

interface OpenGraphImageProps {
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

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { slug, questionId } = await params
  const quiz = await getQuizBySlug(slug)

  if (!quiz) {
    notFound()
  }

  const question = resolveQuestionByParam(quiz.questions, questionId)

  if (!question) {
    notFound()
  }

  const previewText = toQuestionPreviewText(question.question, 220)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 50%, #fdf2f8 100%)',
          color: '#111827',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #c7d2fe',
              background: '#eef2ff',
              color: '#3730a3',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Shared Quiz Question
          </div>

          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>{quiz.title}</div>

          <div style={{ fontSize: 38, lineHeight: 1.35, color: '#1f2937' }}>{previewText}</div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 26,
            color: '#374151',
            fontWeight: 600,
          }}
        >
          <div>Question #{question.id}</div>
          <div>llpmmcampus.com</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
