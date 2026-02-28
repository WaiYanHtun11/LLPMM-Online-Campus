'use client'

import { useEffect, useMemo, useState } from 'react'
import { parseQuestionContent } from '@/lib/quiz-question-utils'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  answerIndex: number
}

interface QuizSessionProps {
  questions: QuizQuestion[]
  slug: string
  quizTitle: string
}

const ROUND_SIZE = 15

function pickRandomQuestions(questions: QuizQuestion[], count: number): QuizQuestion[] {
  const shuffled = [...questions]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = temp
  }

  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export default function QuizSession({ questions, slug, quizTitle }: QuizSessionProps) {
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [copySuccess, setCopySuccess] = useState(false)

  const totalQuestions = useMemo(() => currentQuestions.length, [currentQuestions.length])
  const answeredCount = useMemo(
    () => currentQuestions.filter((question) => answers[question.id] !== undefined).length,
    [answers, currentQuestions]
  )

  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions

  function initializeRound() {
    setCurrentQuestions(pickRandomQuestions(questions, ROUND_SIZE))
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setRound(1)
  }

  function startNewRound() {
    setCurrentQuestions(pickRandomQuestions(questions, ROUND_SIZE))
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setRound((previous) => previous + 1)
  }

  useEffect(() => {
    initializeRound()
  }, [questions])

  function handleSelect(questionId: number, optionIndex: number) {
    if (submitted) return

    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionIndex,
    }))
  }

  function handleSubmit() {
    if (!allAnswered) return

    let correctAnswers = 0

    for (const question of currentQuestions) {
      if (answers[question.id] === question.answerIndex) {
        correctAnswers += 1
      }
    }

    setScore(correctAnswers)
    setSubmitted(true)
  }

  function getRandomQuestionLink() {
    const source = currentQuestions.length > 0 ? currentQuestions : questions
    const randomQuestion = source[Math.floor(Math.random() * source.length)]

    if (!randomQuestion) {
      return null
    }

    return `${window.location.origin}/quizzes/${slug}/${randomQuestion.id}`
  }

  function shareToFacebook() {
    const link = getRandomQuestionLink()
    if (!link) return

    const target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  function shareToTelegram() {
    const link = getRandomQuestionLink()
    if (!link) return

    const text = `Try this ${quizTitle} question`
    const target = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  async function copyShareLink() {
    const link = getRandomQuestionLink()
    if (!link) return

    await navigator.clipboard.writeText(link)
    setCopySuccess(true)

    setTimeout(() => {
      setCopySuccess(false)
    }, 1500)
  }

  if (currentQuestions.length === 0) {
    return <div className="text-center text-gray-600 py-10">Preparing your random quiz set...</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm text-blue-700 font-semibold">Round {round}</div>
          <div className="text-sm text-gray-700">{answeredCount}/{totalQuestions} answered</div>
        </div>
        {submitted ? (
          <div className="text-sm font-semibold text-green-700">Score: {score} / {totalQuestions}</div>
        ) : (
          <div className="text-sm text-gray-600">Answer all questions to submit</div>
        )}
      </div>

      <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4">
        <div className="text-sm font-semibold text-purple-800 mb-2">Share a random question</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={shareToFacebook}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-purple-200 bg-white text-purple-700 hover:bg-purple-100"
          >
            Share to Facebook
          </button>
          <button
            type="button"
            onClick={shareToTelegram}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-purple-200 bg-white text-purple-700 hover:bg-purple-100"
          >
            Share to Telegram
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-purple-200 bg-white text-purple-700 hover:bg-purple-100"
          >
            {copySuccess ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {currentQuestions.map((question, index) => (
        <div key={`${round}-${question.id}`} className="rounded-2xl border border-gray-200 p-6">
          {(() => {
            const parsed = parseQuestionContent(question.question)

            return (
              <>
                <h2 className="font-semibold text-gray-900 mb-4">{index + 1}. {parsed.prompt || question.question}</h2>
                {parsed.hasCode && (
                  <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] overflow-hidden">
                    <div className="bg-white rounded-xl overflow-hidden border border-blue-100/80">
                      <div className="px-3 py-2 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        </div>
                        <span className="text-[11px] font-mono uppercase tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {parsed.language || 'code'}
                        </span>
                      </div>
                    <pre className="bg-slate-50 text-slate-800 text-sm p-4 overflow-x-auto leading-relaxed">
                      <code className="font-mono">{parsed.code}</code>
                    </pre>
                    </div>
                  </div>
                )}
              </>
            )
          })()}
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const isSelected = answers[question.id] === optionIndex
              const isCorrect = submitted && question.answerIndex === optionIndex
              const isWrongSelection = submitted && isSelected && question.answerIndex !== optionIndex

              const colorClass = isCorrect
                ? 'border-green-300 bg-green-50 text-green-800'
                : isWrongSelection
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : isSelected
                    ? 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200'

              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => handleSelect(question.id, optionIndex)}
                  disabled={submitted}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${colorClass} ${submitted ? 'cursor-default' : ''}`}
                >
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="pt-2 space-y-3">
        <div>
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm border ${
            submitted
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
            {submitted ? `Result: ${score} / ${totalQuestions}` : `Result: -- / ${totalQuestions}`}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete This 15-Question Round
            </button>
          ) : (
            <button
              type="button"
              onClick={startNewRound}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Take Another 15 Random Questions
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
