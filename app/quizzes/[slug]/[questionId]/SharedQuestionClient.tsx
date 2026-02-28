'use client'

import { useState } from 'react'
import Link from 'next/link'
import { parseQuestionContent } from '@/lib/quiz-question-utils'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  answerIndex: number
}

interface SharedQuestionClientProps {
  question: QuizQuestion
  slug: string
}

export default function SharedQuestionClient({ question, slug }: SharedQuestionClientProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const parsed = parseQuestionContent(question.question)

  const isCorrect = submitted && selectedIndex === question.answerIndex

  function submitAnswer() {
    if (selectedIndex === null) return
    setSubmitted(true)
  }

  function getCurrentLink() {
    return window.location.href
  }

  function shareToFacebook() {
    const link = getCurrentLink()
    const target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  function shareToTelegram() {
    const link = getCurrentLink()
    const text = `Try this shared ${slug.toUpperCase()} quiz question`
    const target = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(getCurrentLink())
    setCopySuccess(true)

    setTimeout(() => {
      setCopySuccess(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm text-blue-700 font-semibold">Shared Question</div>
          <div className="text-sm text-gray-700">Question #{question.id}</div>
        </div>
        <Link
          href={`/quizzes/${slug}`}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          Take full 15-question round →
        </Link>
      </div>

      <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4">
        <div className="text-sm font-semibold text-purple-800 mb-2">Share this exact question</div>
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

      <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">{parsed.prompt || question.question}</h2>
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

        <div className="space-y-2">
          {question.options.map((option, optionIndex) => {
            const currentlySelected = selectedIndex === optionIndex
            const optionIsCorrect = submitted && optionIndex === question.answerIndex
            const wrongSelection = submitted && currentlySelected && optionIndex !== question.answerIndex

            const colorClass = optionIsCorrect
              ? 'border-green-300 bg-green-50 text-green-800'
              : wrongSelection
                ? 'border-red-300 bg-red-50 text-red-700'
                : currentlySelected
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200'

            return (
              <button
                key={optionIndex}
                type="button"
                onClick={() => !submitted && setSelectedIndex(optionIndex)}
                disabled={submitted}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${colorClass} ${submitted ? 'cursor-default' : ''}`}
              >
                {String.fromCharCode(65 + optionIndex)}. {option}
              </button>
            )
          })}
        </div>

        <div className="pt-5 flex flex-col sm:flex-row gap-3">
          {!submitted ? (
            <button
              type="button"
              onClick={submitAnswer}
              disabled={selectedIndex === null}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          ) : (
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm border ${
              isCorrect
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isCorrect ? 'Correct answer 🎉' : `Incorrect. Correct: ${String.fromCharCode(65 + question.answerIndex)}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
