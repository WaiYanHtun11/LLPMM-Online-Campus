'use client'

import { useMemo, useState } from 'react'

interface GenerateQuizOption {
  slug: string
  title: string
  questionIds: number[]
}

interface GenerateLinkClientProps {
  options: GenerateQuizOption[]
}

export default function GenerateLinkClient({ options }: GenerateLinkClientProps) {
  const [selectedSlug, setSelectedSlug] = useState(options[0]?.slug ?? '')
  const [generatedPath, setGeneratedPath] = useState('')
  const [copied, setCopied] = useState(false)

  const selectedOption = useMemo(
    () => options.find((option) => option.slug === selectedSlug) || null,
    [options, selectedSlug]
  )

  function generateRandomQuestionPath() {
    if (!selectedOption || selectedOption.questionIds.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * selectedOption.questionIds.length)
    const questionId = selectedOption.questionIds[randomIndex]
    const path = `/quizzes/${selectedOption.slug}/${questionId}`

    setGeneratedPath(path)
    setCopied(false)
  }

  function openGeneratedLink() {
    if (!generatedPath) return
    window.open(generatedPath, '_blank', 'noopener,noreferrer')
  }

  async function copyGeneratedLink() {
    if (!generatedPath) return
    const absolute = `${window.location.origin}${generatedPath}`
    await navigator.clipboard.writeText(absolute)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function shareToFacebook() {
    if (!generatedPath) return
    const absolute = `${window.location.origin}${generatedPath}`
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absolute)}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  function shareToTelegram() {
    if (!generatedPath || !selectedOption) return
    const absolute = `${window.location.origin}${generatedPath}`
    const text = `Try this ${selectedOption.title} question`
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(absolute)}&text=${encodeURIComponent(text)}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <label className="block text-sm font-semibold text-blue-800 mb-2" htmlFor="quiz-slug">
          Select language/category
        </label>
        <select
          id="quiz-slug"
          value={selectedSlug}
          onChange={(event) => setSelectedSlug(event.target.value)}
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800"
        >
          {options.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.title} ({option.questionIds.length} questions)
            </option>
          ))}
        </select>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generateRandomQuestionPath}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            Generate Random Link
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="text-sm font-semibold text-gray-800 mb-2">Generated result</div>
        {generatedPath ? (
          <>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 break-all">
              {generatedPath}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openGeneratedLink}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              >
                Open Link
              </button>
              <button
                type="button"
                onClick={copyGeneratedLink}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                type="button"
                onClick={shareToFacebook}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              >
                Share to Facebook
              </button>
              <button
                type="button"
                onClick={shareToTelegram}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              >
                Share to Telegram
              </button>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-600">Click “Generate Random Link” to create a path like /quizzes/mysql/7.</div>
        )}
      </div>
    </div>
  )
}
